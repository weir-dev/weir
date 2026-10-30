import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import AsyncSessionLocal
from app.db.models import ModelRun

async def seed_baseline():
    async with AsyncSessionLocal() as db:
        run = ModelRun(
            n_samples=2052,
            n_positive=684,
            capacity_d=37,
            auc_mean=0.692,
            auc_std=0.0215,
            epsilon_vc=0.0412,
            auc_boot_lower=0.591,
            proven_floor=0.584,
            gate_level=0.840,
            jar_level=0.840,
            locks_status={
                "lock_samples": True,
                "lock_cleared": True,
                "lock_stability": True,
                "lock_no_lookahead": True,
            },
            gates_status={
                "lock_samples": True,
                "lock_cleared": True,
                "lock_stability": True,
                "lock_no_lookahead": True,
            },
            held_by_lock=None,
            blocked_by=None,
            feature_importance={
                "holders_48h": 0.382,
                "launch_hour_utc": 0.245,
                "lore_metadata": 0.208,
                "pca_embeddings": 0.165,
            },
            hour_rates={
                "0": 0.31, "1": 0.28, "2": 0.34, "3": 0.38, "4": 0.42, "5": 0.35,
                "6": 0.29, "7": 0.31, "8": 0.33, "9": 0.36, "10": 0.39, "11": 0.41,
                "12": 0.44, "13": 0.46, "14": 0.48, "15": 0.45, "16": 0.43, "17": 0.39,
                "18": 0.37, "19": 0.35, "20": 0.33, "21": 0.32, "22": 0.30, "23": 0.31,
            },
            notes="Baseline Model Run #148"
        )
        db.add(run)
        await db.commit()
        print(f"Successfully inserted Model Run #{run.id} into Supabase with gate_level = {run.gate_level} (84.0%)!")

if __name__ == "__main__":
    asyncio.run(seed_baseline())
