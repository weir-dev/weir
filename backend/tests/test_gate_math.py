import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
import numpy as np
import pandas as pd
from app.core.config import settings
from app.ml.features import extract_features
from app.ml.gate_math import calculate_epsilon_vc, evaluate_gate_level, locks_thresholds


def _perfect_preds(n_pos: int, n_neg: int):
    y_true = np.array([1] * n_pos + [0] * n_neg)
    y_pred = np.array([0.9] * n_pos + [0.1] * n_neg)
    return y_true, y_pred


def _evaluate(**overrides):
    y_true, y_pred = _perfect_preds(100, 100)
    kwargs = dict(
        auc_mean=0.75, auc_std=0.01, n_samples=200, n_positive=100,
        y_true=y_true, y_pred_proba=y_pred, time_split_gap=0.01,
    )
    kwargs.update(overrides)
    return evaluate_gate_level(**kwargs)


class TestGateMath(unittest.TestCase):
    def test_vc_epsilon_calculation(self):
        eps = calculate_epsilon_vc(340, 28)
        self.assertTrue(0.0 < eps < 1.0)

    def test_vc_epsilon_matches_brief_audit(self):
        # Brief audit: n=1,570, d=28 gives epsilon ~0.324
        self.assertAlmostEqual(calculate_epsilon_vc(1570, 28), 0.324, places=3)

    def test_epsilon_defaults_to_configured_capacity(self):
        self.assertEqual(calculate_epsilon_vc(5000), calculate_epsilon_vc(5000, settings.CAPACITY_D))

    def test_evaluate_gate_level_locks_failure(self):
        res = _evaluate()
        self.assertFalse(res["locks"]["lock_samples"])
        self.assertEqual(res["held_by_lock"], "lock_samples")
        self.assertLessEqual(res["gate_level"], 0.95)

    def test_proven_floor_is_min_of_vc_and_bootstrap(self):
        res = _evaluate()
        self.assertEqual(res["proven_floor"], min(res["floor_vc"], res["auc_boot_lower"]))

    def test_gate_is_driven_by_proven_floor_not_auc(self):
        # High AUC but small sample: VC penalty pushes floor below chance, so gate stays at 0
        res = _evaluate(auc_mean=0.95)
        self.assertLess(res["proven_floor"], settings.AUC_FLOOR)
        self.assertEqual(res["raw_gate_level"], 0.0)
        self.assertEqual(res["gate_level"], 0.0)

    def test_gate_formula(self):
        res = _evaluate(n_samples=200_000, n_positive=60_000, auc_mean=0.58)
        expected = np.clip((res["proven_floor"] - settings.AUC_FLOOR) / (settings.AUC_TARGET - settings.AUC_FLOOR), 0, 1)
        self.assertAlmostEqual(res["raw_gate_level"], float(expected), places=3)

    def test_locks_use_configured_thresholds(self):
        t = locks_thresholds()
        at_min = _evaluate(n_samples=t["lock_samples_min"], n_positive=t["lock_cleared_min"])
        self.assertTrue(at_min["locks"]["lock_samples"])
        self.assertTrue(at_min["locks"]["lock_cleared"])
        below = _evaluate(n_samples=t["lock_samples_min"] - 1, n_positive=t["lock_cleared_min"] - 1)
        self.assertFalse(below["locks"]["lock_samples"])
        self.assertFalse(below["locks"]["lock_cleared"])
        self.assertFalse(_evaluate(auc_std=t["lock_stability_max"])["locks"]["lock_stability"])
        self.assertFalse(_evaluate(time_split_gap=t["lock_no_lookahead_max"] + 0.001)["locks"]["lock_no_lookahead"])

    def test_capacity_d_matches_feature_matrix(self):
        n = 40
        df = pd.DataFrame({
            "launch_hour_utc": [float(i % 24) for i in range(n)],
            "launched_at": pd.date_range("2026-09-01", periods=n, freq="h", tz="UTC"),
            "holders": [float(i) for i in range(n)],
            "lore": ["a small lore line"] * (n - 1) + [None],
            "name": ["Token Name"] * n,
        })
        X, _ = extract_features(df)
        self.assertEqual(X.shape[1], settings.CAPACITY_D)


if __name__ == "__main__":
    unittest.main()
