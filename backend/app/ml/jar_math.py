"""
Backward compatibility layer for jar_math.py.
All logic is now maintained in gate_math.py according to the WEIR specification.
"""
from app.ml.gate_math import (
    calculate_epsilon_vc,
    compute_bootstrap_auc_lower,
    evaluate_gate_level,
    evaluate_jar_level,
    gate_thresholds,
    locks_thresholds,
)

__all__ = [
    "calculate_epsilon_vc",
    "compute_bootstrap_auc_lower",
    "evaluate_gate_level",
    "evaluate_jar_level",
    "gate_thresholds",
    "locks_thresholds",
]
