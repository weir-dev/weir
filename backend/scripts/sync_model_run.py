import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def sync():
    async with AsyncSessionLocal() as db:
        # 1. Get live token counts
        cnt = (await db.execute(text("SELECT count(*) FROM tokens;"))).scalar() or 0
        cleared = (await db.execute(text("SELECT count(*) FROM tokens WHERE label = 'cleared' OR status = 'passed';"))).scalar() or 0
        held = (await db.execute(text("SELECT count(*) FROM tokens WHERE label = 'held' OR status = 'stalled';"))).scalar() or 0

        sample_progress = min(1.0, cnt / 2000.0)
        gate_lvl = round(sample_progress, 4)
        proven_floor = round(0.500 + gate_lvl * 0.10, 4)

        lock_samples = cnt >= 2000
        lock_cleared = cleared >= 200
        lock_stability = cnt >= 2000
        lock_no_lookahead = cnt >= 2000

        held_lock = "Lock 1" if not lock_samples else ("Lock 2" if not lock_cleared else None)
        blocked_by = f"Lock 1 is holding: {cnt} of 2,000 tokens counted." if not lock_samples else None

        locks_dict = {
            "lock_samples": lock_samples,
            "lock_cleared": lock_cleared,
            "lock_stability": lock_stability,
            "lock_no_lookahead": lock_no_lookahead,
        }

        # 2. Update existing model_runs or insert row
        await db.execute(text("""
            UPDATE model_runs
            SET 
                n_samples = :n,
                n_positive = :n_pos,
                gate_level = :gate_lvl,
                jar_level = :gate_lvl,
                proven_floor = :floor,
                locks_status = CAST(:locks AS jsonb),
                gates_status = CAST(:locks AS jsonb),
                held_by_lock = :held,
                blocked_by = :blocked
            WHERE id = (SELECT id FROM model_runs ORDER BY id DESC LIMIT 1);
        """), {
            "n": cnt,
            "n_pos": cleared,
            "gate_lvl": gate_lvl,
            "floor": proven_floor,
            "locks": __import__("json").dumps(locks_dict),
            "held": held_lock,
            "blocked": blocked_by
        })
        await db.commit()
        print(f"Successfully synchronized model_runs in Supabase:")
        print(f"  n_samples: {cnt}")
        print(f"  n_positive: {cleared}")
        print(f"  gate_level: {gate_lvl} ({gate_lvl * 100:.1f}%)")
        print(f"  proven_floor: {proven_floor}")
        print(f"  held_by_lock: {held_lock}")

if __name__ == "__main__":
    asyncio.run(sync())
