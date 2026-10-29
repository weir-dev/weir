import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Numeric, Integer, SmallInteger, 
    Boolean, DateTime, Date, BigInteger, Enum, ForeignKey, Text, Float
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.database import Base

class TokenStatus(str, enum.Enum):
    pending = "pending"
    passed = "passed"
    stalled = "stalled"
    excluded = "excluded"

class Token(Base):
    __tablename__ = "tokens"

    mint = Column(String(64), primary_key=True, index=True) # Base58 Solana mint (32-44 chars)
    chain = Column(String(32), nullable=False, default="solana", index=True)
    name = Column(String(128), nullable=False)
    symbol = Column(String(32), nullable=False)
    lore = Column(Text, nullable=True)
    lore_display = Column(Text, nullable=True)
    lore_withheld = Column(Boolean, nullable=False, default=False)
    image_url = Column(String, nullable=True)
    image_cached_path = Column(String, nullable=True)
    creator = Column(String(64), nullable=True)
    launchpad = Column(String(32), nullable=True) # 'pumpfun' | 'raydium' | 'moonshot' | NULL
    launched_at = Column(DateTime(timezone=True), nullable=False)
    launch_hour_utc = Column(SmallInteger, nullable=True)

    peak_mc = Column(Numeric(20, 2), nullable=False, default=0)
    last_seen_mc = Column(Numeric(20, 2), nullable=True)
    entered_at = Column(DateTime(timezone=True), nullable=True, index=True) # when peak_mc >= $10k
    crossed_10k_at = Column(DateTime(timezone=True), nullable=True) # compatibility alias
    holders_48h = Column(Integer, nullable=True) # sampled at age == 48h
    holders = Column(Integer, nullable=True) # compatibility alias
    holders_sampled_at = Column(DateTime(timezone=True), nullable=True)

    label = Column(String(16), nullable=False, default="open", index=True) # 'open' | 'cleared' | 'held'
    status = Column(Enum(TokenStatus, name="token_status"), nullable=False, default=TokenStatus.pending) # compatibility alias
    labeled_at = Column(DateTime(timezone=True), nullable=True)

    first_seen_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_polled_at = Column(DateTime(timezone=True), nullable=True)
    poll_count = Column(Integer, nullable=False, default=0)
    emile_launched = Column(Boolean, nullable=False, default=False, index=True)

class DailyUniverse(Base):
    __tablename__ = "daily_universe"

    day = Column(Date, primary_key=True)
    minted_total = Column(Integer, nullable=False, default=0)
    crossed_10k = Column(Integer, nullable=False, default=0)
    crossed_30k = Column(Integer, nullable=False, default=0)

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ran_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    n_samples = Column(Integer, nullable=False)
    n_positive = Column(Integer, nullable=False)
    capacity_d = Column(Integer, nullable=False)
    auc_mean = Column(Float, nullable=False)
    auc_std = Column(Float, nullable=False)
    epsilon_vc = Column(Float, nullable=False)
    auc_boot_lower = Column(Float, nullable=False)
    proven_floor = Column(Float, nullable=False)
    gate_level = Column(Float, nullable=False) # water level at the gate (0.0 .. 1.0)
    jar_level = Column(Float, nullable=True) # compatibility alias
    locks_status = Column(JSONB, nullable=False) # Four Locks: {lock_samples, lock_cleared, lock_stability, lock_no_lookahead}
    gates_status = Column(JSONB, nullable=True) # compatibility alias
    held_by_lock = Column(String, nullable=True) # lock name holding the gate (or None)
    blocked_by = Column(String, nullable=True) # compatibility alias
    feature_importance = Column(JSONB, nullable=False)
    hour_rates = Column(JSONB, nullable=False)
    notes = Column(Text, nullable=True)

    def __init__(self, **kwargs):
        if "gate_level" in kwargs and "jar_level" not in kwargs:
            kwargs["jar_level"] = kwargs["gate_level"]
        elif "jar_level" in kwargs and "gate_level" not in kwargs:
            kwargs["gate_level"] = kwargs["jar_level"]

        if "locks_status" in kwargs and "gates_status" not in kwargs:
            kwargs["gates_status"] = kwargs["locks_status"]
        elif "gates_status" in kwargs and "locks_status" not in kwargs:
            kwargs["locks_status"] = kwargs["gates_status"]

        if "held_by_lock" in kwargs and "blocked_by" not in kwargs:
            kwargs["blocked_by"] = kwargs["held_by_lock"]
        elif "blocked_by" in kwargs and "held_by_lock" not in kwargs:
            kwargs["held_by_lock"] = kwargs["blocked_by"]

        super().__init__(**kwargs)

class IngestLog(Base):
    __tablename__ = "ingest_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    source = Column(String, nullable=False)
    ok = Column(Integer, nullable=False, default=0)
    failed = Column(Integer, nullable=False, default=0)
    latency_ms = Column(Integer, nullable=True)

class LoreModerationLog(Base):
    __tablename__ = "lore_moderation_log"

    mint = Column(String, ForeignKey("tokens.mint"), primary_key=True)
    raw_lore = Column(Text, nullable=True)
    filtered_reason = Column(String, nullable=True)
    filtered_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

# Émile 1.5 — Autonomous Idea Generation Models
class IdeaCycle(Base):
    __tablename__ = "idea_cycles"

    cycle_id = Column(BigInteger, primary_key=True, autoincrement=True)
    run_id = Column(BigInteger, ForeignKey("model_runs.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    generator_sha = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    seed = Column(String, nullable=False)
    median_holders = Column(Integer, nullable=False)
    n_generated = Column(Integer, nullable=False)
    n_rejected = Column(Integer, nullable=False)
    n_excluded = Column(Integer, nullable=False)

class IdeaCandidate(Base):
    __tablename__ = "idea_candidates"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    cycle_id = Column(BigInteger, ForeignKey("idea_cycles.cycle_id"), nullable=False)
    rank = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    lore = Column(Text, nullable=False)
    hour = Column(SmallInteger, nullable=False)
    score = Column(Numeric(8, 6), nullable=False)
    commitment = Column(String, nullable=False)
    committed_at = Column(DateTime(timezone=True), nullable=False)
    image_sha = Column(String, nullable=True)

class IdeaExclusion(Base):
    __tablename__ = "idea_exclusions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    first_cycle = Column(BigInteger, nullable=False)
    first_seen_at = Column(DateTime(timezone=True), nullable=False)
    deployed_mint = Column(String, nullable=False)
    deployer = Column(String, nullable=False)
    deployed_at = Column(DateTime(timezone=True), nullable=False)
    block_number = Column(BigInteger, nullable=False)

class LaunchStatus(str, enum.Enum):
    preparing_launch = "preparing_launch"
    pending_48h = "pending_48h"
    passed = "passed"
    stalled = "stalled"
    skipped = "skipped"

class Launch(Base):
    __tablename__ = "launches"

    launch_id = Column(BigInteger, primary_key=True, autoincrement=True)
    day_index = Column(Integer, nullable=False, unique=True)
    cycle_id = Column(BigInteger, ForeignKey("idea_cycles.cycle_id"), nullable=False)
    run_id = Column(BigInteger, ForeignKey("model_runs.id"), nullable=False)
    candidate_id = Column(BigInteger, ForeignKey("idea_candidates.id"), nullable=False)

    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    lore = Column(Text, nullable=False)
    launch_hour = Column(SmallInteger, nullable=False)
    rank_in_cycle = Column(Integer, nullable=False)

    predicted_prob = Column(Numeric(8, 6), nullable=False)
    prediction_sha = Column(String, nullable=False)
    prediction_at = Column(DateTime(timezone=True), nullable=False)

    status = Column(Enum(LaunchStatus, name="launch_status"), nullable=False, default=LaunchStatus.preparing_launch)
    mint = Column(String, nullable=True, unique=True)
    deploy_tx = Column(String, nullable=True)
    pool_tx = Column(String, nullable=True)
    lp_burn_tx = Column(String, nullable=True)
    renounce_tx = Column(String, nullable=True)
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    liquidity_wei = Column(Numeric(40, 0), nullable=True)

    peak_mc = Column(Numeric(18, 2), nullable=True)
    holders_48h = Column(Integer, nullable=True)
    outcome = Column(String, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    contributions = Column(JSONB, nullable=True)
    skipped_reason = Column(Text, nullable=True)

class TwitterPost(Base):
    __tablename__ = "twitter_posts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tweet_id = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    target_token = Column(String, nullable=False, default="emile")  # 'emile' | 'emile_banana'
    market_cap_usd = Column(Numeric(20, 2), nullable=True)
    volume_24h_usd = Column(Numeric(20, 2), nullable=True)
    holders_count = Column(Integer, nullable=True)
    trigger_type = Column(String, nullable=False, default="recurring_2h_news")  # 'recurring_2h_news' | 'manual_test'
    status = Column(String, nullable=False, default="dry_run")  # 'sent' | 'dry_run' | 'failed'
    posted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    error_message = Column(Text, nullable=True)

