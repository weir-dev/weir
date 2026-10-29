import math
import numpy as np
from sklearn.metrics import roc_auc_score

from app.core.config import settings

def locks_thresholds() -> dict:
    """Published Four Locks thresholds, served to clients so nothing is hardcoded twice."""
    return {
        "lock_samples_min": settings.GATE_N_SAMPLES,
        "lock_cleared_min": settings.GATE_N_POSITIVE,
        "lock_stability_max": settings.GATE_AUC_STD_MAX,
        "lock_no_lookahead_max": settings.GATE_TIME_SPLIT_GAP_MAX,
        # Backward compatibility aliases
        "n_samples_min": settings.GATE_N_SAMPLES,
        "n_positive_min": settings.GATE_N_POSITIVE,
        "auc_std_max": settings.GATE_AUC_STD_MAX,
        "time_split_gap_max": settings.GATE_TIME_SPLIT_GAP_MAX,
    }

# Backward compatibility alias
gate_thresholds = locks_thresholds

def calculate_epsilon_vc(n: int, d: int = settings.CAPACITY_D, delta: float = settings.DELTA_CONFIDENCE) -> float:
    """
    Calculates the Vapnik-Chervonenkis (VC) capacity penalty:
    epsilon = sqrt((d * (ln(2n/d) + 1) + ln(4/delta)) / n)
    """
    if n <= d or n <= 0:
        return 1.0
    
    term1 = d * (math.log(2.0 * n / d) + 1.0)
    term2 = math.log(4.0 / delta)
    val = (term1 + term2) / n
    return math.sqrt(val) if val > 0 else 0.0

def compute_bootstrap_auc_lower(y_true: np.ndarray, y_pred_proba: np.ndarray, n_bootstraps: int = 2000, alpha_percentile: float = 2.5) -> float:
    """
    Computes the 2.5th percentile lower bound of ROC-AUC using 2000 bootstrap resamples.
    """
    n_samples = len(y_true)
    if n_samples < 10:
        return 0.5

    rng = np.random.RandomState(42)
    bootstrapped_scores = []
    
    for _ in range(n_bootstraps):
        indices = rng.randint(0, n_samples, n_samples)
        if len(np.unique(y_true[indices])) < 2:
            continue
        score = roc_auc_score(y_true[indices], y_pred_proba[indices])
        bootstrapped_scores.append(score)
        
    if not bootstrapped_scores:
        return 0.5
        
    return float(np.percentile(bootstrapped_scores, alpha_percentile))

def evaluate_gate_level(
    auc_mean: float,
    auc_std: float,
    n_samples: int,
    n_positive: int,
    y_true: np.ndarray,
    y_pred_proba: np.ndarray,
    time_split_gap: float,
    d: int = settings.CAPACITY_D,
    target_auc: float = settings.AUC_TARGET,
    floor_auc: float = settings.AUC_FLOOR
) -> dict:
    """
    Evaluates the model performance, VC bound, bootstrap bound, Four Locks, and water gate level.
    
    Returns dict with keys:
    - epsilon_vc: VC capacity penalty
    - floor_vc: auc_mean - epsilon_vc
    - auc_boot_lower: 2.5th percentile bootstrap lower bound
    - proven_floor: min(floor_vc, auc_boot_lower)
    - raw_gate_level: clamped 0..1, (proven_floor - floor_auc) / (target_auc - floor_auc)
    - gate_level: final water level (capped at 0.95 while any lock fails)
    - locks: dict of bool checks {lock_samples, lock_cleared, lock_stability, lock_no_lookahead}
    - held_by_lock: first failing lock name or None
    """
    eps_vc = calculate_epsilon_vc(n_samples, d)
    floor_vc = auc_mean - eps_vc
    floor_boot = compute_bootstrap_auc_lower(y_true, y_pred_proba, n_bootstraps=2000)
    
    proven_floor = min(floor_vc, floor_boot)
    
    # Water level is driven by the proven floor, not the raw AUC
    raw_gate_level = float(np.clip((proven_floor - floor_auc) / (target_auc - floor_auc), 0.0, 1.0))
    
    # Four Locks Evaluation (WEIR Specification §6.7)
    locks = {
        "lock_samples": n_samples >= settings.GATE_N_SAMPLES,
        "lock_cleared": n_positive >= settings.GATE_N_POSITIVE,
        "lock_stability": auc_std < settings.GATE_AUC_STD_MAX,
        "lock_no_lookahead": time_split_gap <= settings.GATE_TIME_SPLIT_GAP_MAX,
        # Backward-compatible keys for gates
        "n_samples": n_samples >= settings.GATE_N_SAMPLES,
        "n_positive": n_positive >= settings.GATE_N_POSITIVE,
        "auc_std": auc_std < settings.GATE_AUC_STD_MAX,
        "time_split": time_split_gap <= settings.GATE_TIME_SPLIT_GAP_MAX
    }
    
    primary_locks = {
        "lock_samples": locks["lock_samples"],
        "lock_cleared": locks["lock_cleared"],
        "lock_stability": locks["lock_stability"],
        "lock_no_lookahead": locks["lock_no_lookahead"]
    }
    
    all_passed = all(primary_locks.values())
    held_by_lock = None if all_passed else next(k for k, v in primary_locks.items() if not v)
    
    # Cap water level at 0.95 while any lock is holding
    gate_level = raw_gate_level if all_passed else min(raw_gate_level, 0.95)
    
    return {
        "auc_mean": round(float(auc_mean), 4),
        "auc_std": round(float(auc_std), 4),
        "n_samples": n_samples,
        "n_positive": n_positive,
        "capacity_d": d,
        "epsilon_vc": round(float(eps_vc), 4),
        "floor_vc": round(float(floor_vc), 4),
        "auc_boot_lower": round(float(floor_boot), 4),
        "proven_floor": round(float(proven_floor), 4),
        "time_split_gap": round(float(time_split_gap), 4),
        "raw_gate_level": round(float(raw_gate_level), 4),
        "gate_level": round(float(gate_level), 4),
        "locks": primary_locks,
        "held_by_lock": held_by_lock,
        # Backward compatibility aliases
        "raw_jar_level": round(float(raw_gate_level), 4),
        "jar_level": round(float(gate_level), 4),
        "gates": locks,
        "blocked_by": held_by_lock
    }

# Backward compatibility alias
evaluate_jar_level = evaluate_gate_level
