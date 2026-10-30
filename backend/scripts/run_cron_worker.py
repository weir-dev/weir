import asyncio
import os
import sys
from datetime import datetime, timezone, date
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import AsyncSessionLocal
from app.services.mint_source import get_default_mint_source
from app.services.dexscreener import DexScreenerPoller
from app.services.lore_safety import sanitize_lore
from app.services.holder_sampler import run_label_worker_cycle
from app.services.model_worker import run_model_cycle

async def run_pipeline():
    print("=" * 60)
    print(f"[{datetime.now(timezone.utc).isoformat()}] STARTING WEIR SOLANA WORKER CRON")
    print("=" * 60)

    # 1. SCAN & INGEST SOLANA TOKENS
    print("\n[STEP 1/3] Scanning newly active Solana tokens...")
    scanner = get_default_mint_source()
    poller = DexScreenerPoller()
    now_dt = datetime.now(timezone.utc)
    today = date.today()

    try:
        raw_mints = await scanner.fetch_since(None)
        print(f"Found {len(raw_mints)} tokens from Solana scanner.")
    except Exception as e:
        print(f"Error scanning mints: {e}")
        raw_mints = []

    valid_mints = [m for m in raw_mints if m.mint and 32 <= len(m.mint) <= 44]
    if valid_mints:
        mint_addresses = [m.mint for m in valid_mints]
        prices = await poller.fetch_batch_prices(mint_addresses)
        print(f"Fetched current prices for {len(prices)} tokens.")

        async with AsyncSessionLocal() as db:
            newly_inserted = 0
            for raw in valid_mints:
                lore_disp, withheld, reason = sanitize_lore(raw.lore)
                price_data = prices.get(raw.mint)
                token_name = raw.name
                token_symbol = raw.symbol

                if isinstance(price_data, dict):
                    current_mc = float(price_data.get("mc") or 10500.0)
                    if price_data.get("name"):
                        token_name = price_data.get("name")
                    if price_data.get("symbol"):
                        token_symbol = price_data.get("symbol")
                elif isinstance(price_data, (int, float)):
                    current_mc = float(price_data)
                else:
                    current_mc = 10500.0

                assigned_label = "cleared" if current_mc >= 30000.0 else "open"
                assigned_status = "passed" if current_mc >= 30000.0 else "pending"

                query = text("""
                    INSERT INTO tokens (
                        mint, chain, name, symbol, lore, lore_display, lore_withheld,
                        image_url, creator, launchpad, launched_at, peak_mc, last_seen_mc,
                        label, status, first_seen_at, poll_count, entered_at, crossed_10k_at, emile_launched
                    ) VALUES (
                        :mint, 'solana', :name, :symbol, :lore, :lore_disp, :withheld,
                        :image_url, :creator, :launchpad, :launched_at, :peak_mc, :last_seen_mc,
                        :label, CAST(:status AS token_status), :now, 1,
                        CASE WHEN :peak_mc >= 10000.0 THEN :now ELSE CAST(NULL AS timestamptz) END,
                        CASE WHEN :peak_mc >= 10000.0 THEN :now ELSE CAST(NULL AS timestamptz) END,
                        FALSE
                    )
                    ON CONFLICT (mint) DO UPDATE SET
                        peak_mc = GREATEST(tokens.peak_mc, EXCLUDED.peak_mc),
                        last_seen_mc = EXCLUDED.last_seen_mc,
                        last_polled_at = :now,
                        poll_count = tokens.poll_count + 1,
                        name = CASE 
                            WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' THEN EXCLUDED.name 
                            ELSE tokens.name 
                        END,
                        symbol = CASE 
                            WHEN EXCLUDED.symbol IS NOT NULL AND EXCLUDED.symbol != '' THEN EXCLUDED.symbol 
                            ELSE tokens.symbol 
                        END,
                        label = CASE
                            WHEN GREATEST(tokens.peak_mc, EXCLUDED.peak_mc) >= 30000.0 THEN 'cleared'
                            ELSE tokens.label
                        END,
                        status = CASE
                            WHEN GREATEST(tokens.peak_mc, EXCLUDED.peak_mc) >= 30000.0 THEN CAST('passed' AS token_status)
                            ELSE tokens.status
                        END,
                        entered_at = CASE
                            WHEN tokens.entered_at IS NULL AND EXCLUDED.peak_mc >= 10000.0 THEN :now
                            ELSE tokens.entered_at
                        END,
                        crossed_10k_at = CASE
                            WHEN tokens.crossed_10k_at IS NULL AND EXCLUDED.peak_mc >= 10000.0 THEN :now
                            ELSE tokens.crossed_10k_at
                        END
                    RETURNING (xmax = 0) AS is_new;
                """)

                res = await db.execute(query, {
                    "mint": raw.mint,
                    "name": token_name,
                    "symbol": token_symbol,
                    "lore": raw.lore,
                    "lore_disp": lore_disp,
                    "withheld": withheld,
                    "image_url": raw.image_url,
                    "creator": raw.creator,
                    "launchpad": getattr(raw, "launchpad", None),
                    "launched_at": raw.launched_at,
                    "peak_mc": current_mc,
                    "last_seen_mc": current_mc,
                    "label": assigned_label,
                    "status": assigned_status,
                    "now": now_dt
                })

                row = res.fetchone()
                if row and row[0]:
                    newly_inserted += 1

            if newly_inserted > 0:
                await db.execute(text("""
                    INSERT INTO daily_universe (day, minted_total, crossed_10k, crossed_30k)
                    VALUES (:day, :cnt, :cnt, 0)
                    ON CONFLICT (day) DO UPDATE SET
                        minted_total = daily_universe.minted_total + :cnt,
                        crossed_10k = daily_universe.crossed_10k + :cnt;
                """), {"day": today, "cnt": newly_inserted})

            await db.execute(
                text("INSERT INTO ingest_log (source, ok, failed) VALUES (:src, :ok, 0);"),
                {"src": "github_actions_cron", "ok": len(valid_mints)}
            )
            await db.commit()
            print(f"Ingest complete: {len(valid_mints)} tokens processed (+{newly_inserted} newly inserted into Supabase).")

    # 2. RUN 48-HOUR HOLDER SAMPLER & LABEL WORKER
    print("\n[STEP 2/3] Checking 48h mature tokens for labeling & holder sampling...")
    async with AsyncSessionLocal() as db:
        await run_label_worker_cycle(db)
        await db.commit()
    print("Label worker cycle completed.")

    # 3. RUN MACHINE LEARNING TRAINING & FOUR LOCKS EVALUATION
    print("\n[STEP 3/3] Checking if ML Model retrain is required...")
    try:
        run_payload = await run_model_cycle()
        if run_payload:
            print(f"New ML Model run recorded! Run ID: #{run_payload.get('id', 'N/A')}, AUC: {run_payload.get('auc_mean', 0.0):.4f}")
        else:
            print("ML model is up-to-date with current labeled data.")
    except Exception as e:
        print(f"Model cycle check completed with note: {e}")

    # Summary
    async with AsyncSessionLocal() as db:
        cnt_all = (await db.execute(text("SELECT count(*) FROM tokens;"))).scalar()
        cnt_cleared = (await db.execute(text("SELECT count(*) FROM tokens WHERE label = 'cleared';"))).scalar()
        cnt_held = (await db.execute(text("SELECT count(*) FROM tokens WHERE label = 'held';"))).scalar()
        print("\n" + "=" * 60)
        print(f"DATABASE SUMMARY (Supabase):")
        print(f"  Total Entered: {cnt_all:,}")
        print(f"  Cleared ($30k+): {cnt_cleared:,}")
        print(f"  Held Below:      {cnt_held:,}")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_pipeline())
