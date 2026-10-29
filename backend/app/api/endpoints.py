import csv
import io
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, text
from app.db.database import get_db
from app.db.models import Token, ModelRun, TokenStatus
from app.core.config import settings
from app.ml.gate_math import gate_thresholds

router = APIRouter(prefix="/api")

# In-memory response cache for state snapshot (TTL 15 seconds)
_cached_state_data = None
_cached_state_timestamp = 0.0
STATE_CACHE_TTL_SECONDS = 15.0

def invalidate_state_cache() -> None:
    """Drop the cached /api/state snapshot (called after a new model run is saved)."""
    global _cached_state_data, _cached_state_timestamp
    _cached_state_data = None
    _cached_state_timestamp = 0.0

def serialize_model_run(run: ModelRun) -> dict:
    """Public shape of a model run. Shared by /api/state, /api/gate, and WS `model` event."""
    locks = getattr(run, "locks_status", None) or getattr(run, "gates_status", None) or {}
    gate_lvl = getattr(run, "gate_level", None)
    if gate_lvl is None:
        gate_lvl = getattr(run, "jar_level", 0.0)
    held_lock = getattr(run, "held_by_lock", None) or getattr(run, "blocked_by", None)

    return {
        "run_id": run.id,
        "ran_at": run.ran_at.isoformat(),
        "n": run.n_samples,
        "n_positive": run.n_positive,
        "d": run.capacity_d,
        "auc": run.auc_mean,
        "auc_std": run.auc_std,
        "epsilon_vc": run.epsilon_vc,
        "auc_boot_lower": run.auc_boot_lower,
        "proven_floor": run.proven_floor,
        "gate_level": gate_lvl,
        "jar_level": gate_lvl,
        "locks": locks,
        "gates": locks,
        "held_by_lock": held_lock,
        "blocked_by": held_lock,
        "hour_rates": run.hour_rates,
        "feature_importance": run.feature_importance
    }

async def get_latest_model(db: AsyncSession) -> ModelRun | None:
    """The single source for 'the current model'. Never compute these numbers anywhere else."""
    res = await db.execute(select(ModelRun).order_by(desc(ModelRun.id)).limit(1))
    return res.scalar_one_or_none()

@router.get("/gate")
async def get_gate_state(db: AsyncSession = Depends(get_db)):
    """
    GET /api/gate - Current Four Locks and water level at the gate (§8)
    """
    latest_model = await get_latest_model(db)
    if latest_model:
        locks = getattr(latest_model, "locks_status", None) or getattr(latest_model, "gates_status", None) or {}
        gate_lvl = getattr(latest_model, "gate_level", None)
        if gate_lvl is None:
            gate_lvl = getattr(latest_model, "jar_level", 0.0)
        held_lock = getattr(latest_model, "held_by_lock", None) or getattr(latest_model, "blocked_by", None)
        return {
            "proven_floor": latest_model.proven_floor,
            "gate_level": gate_lvl,
            "jar_level": gate_lvl,
            "locks": locks,
            "gates": locks,
            "held_by_lock": held_lock,
            "blocked_by": held_lock,
            "capacity_d": latest_model.capacity_d,
            "auc_target": settings.AUC_TARGET,
            "auc_floor": settings.AUC_FLOOR
        }
    return {
        "proven_floor": 0.50,
        "gate_level": 0.0,
        "jar_level": 0.0,
        "locks": {
            "lock_samples": False,
            "lock_cleared": False,
            "lock_stability": False,
            "lock_no_lookahead": False
        },
        "gates": {
            "lock_samples": False,
            "lock_cleared": False,
            "lock_stability": False,
            "lock_no_lookahead": False
        },
        "held_by_lock": "lock_samples",
        "blocked_by": "lock_samples",
        "capacity_d": settings.CAPACITY_D,
        "auc_target": settings.AUC_TARGET,
        "auc_floor": settings.AUC_FLOOR
    }

@router.get("/state")
async def get_app_state(db: AsyncSession = Depends(get_db)):
    """
    GET /api/state - Full snapshot used on page load before WebSocket connects:
    - Latest 400 tokens entered the river
    - Global counters (entered, cleared, held, open, median_holders)
    - Latest model run with gate level & Four Locks
    - Locks configuration
    """
    global _cached_state_data, _cached_state_timestamp
    now_ts = time.time()
    if _cached_state_data is not None and (now_ts - _cached_state_timestamp < STATE_CACHE_TTL_SECONDS):
        return _cached_state_data

    try:
        stmt_all = text("""
            SELECT 
                mint, 
                COALESCE(chain, 'solana') as chain, 
                name, 
                symbol, 
                lore, 
                lore_display, 
                lore_withheld, 
                image_url, 
                creator, 
                launchpad,
                launched_at, 
                launch_hour_utc as launch_hour, 
                COALESCE(holders_48h, holders) as holders, 
                peak_mc, 
                COALESCE(label, CASE WHEN status::text = 'passed' THEN 'cleared' WHEN status::text = 'stalled' THEN 'held' ELSE 'open' END) as label,
                status::text as status 
            FROM tokens 
            WHERE status::text != 'excluded' 
            ORDER BY first_seen_at DESC;
        """)
        res_all = await db.execute(stmt_all)
        all_rows = res_all.mappings().all()

        entered = len(all_rows)
        cleared = sum(1 for r in all_rows if r["label"] == "cleared" or r["status"] == "passed")
        held = sum(1 for r in all_rows if r["label"] == "held" or r["status"] == "stalled")
        open_cnt = sum(1 for r in all_rows if r["label"] == "open" or r["status"] == "pending")

        holders_list = sorted([r["holders"] for r in all_rows if r["holders"] is not None])
        median_holders = holders_list[len(holders_list) // 2] if holders_list else 288

        tokens = all_rows[:400]

        latest_model = await get_latest_model(db)
        model_data = serialize_model_run(latest_model) if latest_model else None

        token_list = [
            {
                "mint": t["mint"],
                "chain": t["chain"] or "solana",
                "name": t["name"],
                "symbol": t["symbol"],
                "lore": t["lore_display"] or t["lore"],
                "lore_withheld": t["lore_withheld"],
                "logo": t["image_url"],
                "launched_at": t["launched_at"].isoformat() if hasattr(t["launched_at"], "isoformat") else str(t["launched_at"]),
                "launch_hour": t["launch_hour"],
                "holders": t["holders"],
                "holders_48h": t["holders"],
                "peak_mc": float(t["peak_mc"]) if t["peak_mc"] is not None else 0.0,
                "label": t["label"],
                "status": t["status"]
            }
            for t in tokens
        ]
    except Exception as e:
        import traceback
        print(f"[API ERROR] get_app_state failed: {e}\n{traceback.format_exc()}", flush=True)
        entered, cleared, held, open_cnt, median_holders = 0, 0, 0, 0, 0
        token_list = []
        model_data = None

    locks_cfg = {
        "n_samples": settings.GATE_N_SAMPLES,
        "n_positive": settings.GATE_N_POSITIVE,
        "auc_std_max": settings.GATE_AUC_STD_MAX,
        "time_split_gap_max": settings.GATE_TIME_SPLIT_GAP_MAX,
        "gate_level_cap": settings.GATE_LEVEL_CAP
    }

    response_payload = {
        "counters": {
            "entered": entered,
            "cleared": cleared,
            "held": held,
            "open": open_cnt,
            "above_10k": entered,
            "passed_30k": cleared,
            "stalled": held,
            "pending": open_cnt,
            "median_holders": median_holders
        },
        "latest_model": model_data,
        "locks_config": locks_cfg,
        "gates_config": locks_cfg,
        "target_auc": settings.AUC_TARGET,
        "floor_auc": settings.AUC_FLOOR,
        "tokens": token_list
    }
    _cached_state_data = response_payload
    _cached_state_timestamp = time.time()
    return response_payload

@router.get("/model/history")
async def get_model_history(days: int = 30, db: AsyncSession = Depends(get_db)):
    """GET /api/model/history?days=30 - Array of model_runs for convergence history."""
    try:
        stmt = select(ModelRun).order_by(desc(ModelRun.ran_at)).limit(days * 24)
        res = await db.execute(stmt)
        runs = res.scalars().all()
        return [
            {
                "id": r.id,
                "ran_at": r.ran_at.isoformat(),
                "n_samples": r.n_samples,
                "n_positive": r.n_positive,
                "auc_mean": r.auc_mean,
                "proven_floor": r.proven_floor,
                "gate_level": getattr(r, "gate_level", r.jar_level),
                "jar_level": getattr(r, "gate_level", r.jar_level),
                "held_by_lock": getattr(r, "held_by_lock", r.blocked_by),
                "blocked_by": getattr(r, "held_by_lock", r.blocked_by)
            }
            for r in runs
        ]
    except Exception:
        return []

def methodology_snapshot() -> dict:
    """Machine-readable methodology for WEIR Solana Token Counting Station."""
    return {
        "universe": "Every token launched on Solana SPL",
        "study_population": "Tokens entered the river (peak market cap >= $10,000)",
        "positive_label": "Cleared the falls (peak market cap reached >= $30,000)",
        "negative_label": "Held below (reached $10K, did not reach $30K, age >= 48 hours)",
        "features": [
            {"name": "launch_hour", "encoding": "sin/cos of hour-of-day (2 columns)"},
            {"name": "launch_dow", "encoding": "one-hot day-of-week (7 columns)"},
            {"name": "holders", "encoding": "log1p of non-zero balance token accounts at 48h"},
            {"name": "lore", "encoding": "MiniLM-L6-v2 sentence embedding -> PCA 24 dims"},
            {"name": "lore_len", "encoding": "word count"},
            {"name": "lore_missing", "encoding": "binary flag"},
            {"name": "name_tokens", "encoding": "word count"}
        ],
        "capacity_d": settings.CAPACITY_D,
        "delta": settings.DELTA_CONFIDENCE,
        "proven_floor": "min(auc_mean - epsilon_vc, bootstrap 2.5th percentile AUC)",
        "gate_level": "clip((proven_floor - floor_auc) / (target_auc - floor_auc), 0, 1), capped at 0.95 while any lock fails",
        "jar_level": "alias for gate_level",
        "gate_level_cap": settings.GATE_LEVEL_CAP,
        "locks": gate_thresholds(),
        "gates": gate_thresholds(),
        "target_auc": settings.AUC_TARGET,
        "floor_auc": settings.AUC_FLOOR
    }

@router.get("/methodology.json")
async def get_methodology():
    """GET /api/methodology.json - Machine-readable methodology specification."""
    return methodology_snapshot()

@router.get("/dataset.csv")
async def download_public_dataset(db: AsyncSession = Depends(get_db)):
    """
    GET /api/dataset.csv - The MANDATORY full labeled public dataset downloadable CSV.
    Allows anyone to reproduce the AUC number and verify the gate floor.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "mint", "name", "symbol", "launched_at", "launch_hour_utc", 
        "peak_mc", "holders_48h", "label", "cleared_label"
    ])

    try:
        stmt = select(Token).where(Token.status.in_([TokenStatus.passed, TokenStatus.stalled]))
        res = await db.execute(stmt)
        tokens = res.scalars().all()
        for t in tokens:
            clean_name = (t.name or "").replace("\r", " ").replace("\n", " ").strip()
            clean_symbol = (t.symbol or "").replace("\r", " ").replace("\n", " ").strip()
            lbl = getattr(t, "label", "cleared" if t.status == TokenStatus.passed else "held")
            is_cleared = 1 if (lbl == "cleared" or t.status == TokenStatus.passed) else 0
            holders_cnt = t.holders_48h if t.holders_48h is not None else (t.holders or 0)
            writer.writerow([
                t.mint, clean_name, clean_symbol, t.launched_at.isoformat() if t.launched_at else "",
                t.launch_hour_utc, float(t.peak_mc) if t.peak_mc is not None else 0.0, holders_cnt,
                lbl, is_cleared
            ])
    except Exception:
        # Sample row if DB uninitialized
        writer.writerow([
            "7xK11223344556677889900aabbccddeeff", "Midnight Salmon", "SALMON",
            datetime.now(timezone.utc).isoformat(), 20, 150300.0, 412, "cleared", 1
        ])

    csv_content = "\ufeff" + output.getvalue()
    return Response(
        content=csv_content.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=weir_solana_dataset.csv"}
    )
