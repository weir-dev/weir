import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        cnt = (await db.execute(text("SELECT count(*) FROM tokens;"))).scalar()
        cleared = (await db.execute(text("SELECT count(*) FROM tokens WHERE label = 'cleared' OR status = 'passed';"))).scalar()
        held = (await db.execute(text("SELECT count(*) FROM tokens WHERE label = 'held' OR status = 'stalled';"))).scalar()
        runs = (await db.execute(text("SELECT id, n_samples, gate_level, held_by_lock FROM model_runs ORDER BY id DESC LIMIT 5;"))).mappings().all()
        print(f"TOKENS COUNT: {cnt}")
        print(f"CLEARED COUNT: {cleared}")
        print(f"HELD COUNT: {held}")
        print("MODEL RUNS:", [dict(r) for r in runs])

if __name__ == "__main__":
    asyncio.run(main())
