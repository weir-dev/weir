import httpx
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.models import Token, TokenStatus
from app.core.config import settings
from app.api.websocket import manager

async def sample_solana_holders(mint: str) -> Optional[int]:
    """
    Sample Solana SPL token holder count at 48h mark using Helius DAS or Solana RPC.
    Returns integer holder count or None if unreachable.
    """
    if not mint:
        return None

    # 1. Try Helius DAS RPC if key is configured
    rpc_url = settings.SOLANA_RPC_URL
    if settings.CLEAN_HELIUS_API_KEY and "api-key=" not in rpc_url:
        rpc_url = f"https://mainnet.helius-rpc.com/?api-key={settings.CLEAN_HELIUS_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            # Helius DAS getTokenAccounts call
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getTokenAccounts",
                "params": {
                    "mint": mint,
                    "page": 1,
                    "limit": 10
                }
            }
            resp = await client.post(rpc_url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                res = data.get("result")
                if isinstance(res, dict) and "total" in res:
                    return int(res["total"])
                if isinstance(res, dict) and "token_accounts" in res:
                    return len(res["token_accounts"])

            # Fallback to standard Solana RPC getTokenLargestAccounts
            rpc_payload = {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "getTokenLargestAccounts",
                "params": [mint]
            }
            resp_rpc = await client.post(rpc_url, json=rpc_payload)
            if resp_rpc.status_code == 200:
                data_rpc = resp_rpc.json()
                largest = data_rpc.get("result", {}).get("value")
                if isinstance(largest, list):
                    return max(len(largest), 1)
    except Exception:
        pass

    return None

async def sample_token_holders(mint: str, launched_at: datetime) -> Optional[int]:
    """Alias for backwards compatibility and 48h sampling."""
    return await sample_solana_holders(mint)

async def run_label_worker_cycle(db: AsyncSession) -> dict:
    """
    WEIR Label Worker Cycle (runs every 15 minutes):
    1. Select tokens with label='open' (or status='pending') where launched_at <= NOW() - 48 hours.
    2. Sample holder count via Solana RPC / Helius DAS (sampled once at 48h).
    3. Assign WEIR label:
       - 'cleared' (passed) if peak_mc >= 30,000
       - 'held' (stalled) if peak_mc < 30,000
    4. Update label, status, labeled_at, holders_48h, holders in database.
    5. Broadcast WS events: 'cleared', 'held'.
    """
    now = datetime.now(timezone.utc)
    cutoff = text("NOW() - INTERVAL '48 hours'")

    query = select(Token).where(
        Token.status == TokenStatus.pending,
        Token.launched_at <= cutoff
    ).limit(100)

    res = await db.execute(query)
    pending_tokens = res.scalars().all()

    labeled_cleared = 0
    labeled_held = 0

    for token in pending_tokens:
        # 1. Sample holders ONCE at 48h mark
        holders_count = await sample_solana_holders(token.mint)
        token.holders_48h = holders_count
        token.holders = holders_count
        token.holders_sampled_at = now if holders_count is not None else None
        token.labeled_at = now

        peak = float(token.peak_mc) if token.peak_mc is not None else 0.0

        # 2. Assign label based on $30K peak market cap rule (§2)
        if peak >= 30000.0:
            token.label = "cleared"
            token.status = TokenStatus.passed
            labeled_cleared += 1
            await manager.broadcast({
                "cleared": {
                    "mint": token.mint,
                    "name": token.name,
                    "symbol": token.symbol,
                    "peak_mc": peak,
                    "cleared_at": now.isoformat()
                }
            })
        else:
            token.label = "held"
            token.status = TokenStatus.stalled
            labeled_held += 1
            await manager.broadcast({
                "held": {
                    "mint": token.mint,
                    "name": token.name,
                    "symbol": token.symbol,
                    "peak_mc": peak,
                    "holders_48h": holders_count
                }
            })

    await db.commit()
    return {
        "processed": len(pending_tokens),
        "cleared": labeled_cleared,
        "held": labeled_held,
        "passed": labeled_cleared,
        "stalled": labeled_held
    }
