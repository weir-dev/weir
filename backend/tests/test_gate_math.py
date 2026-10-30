import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
import numpy as np
import pandas as pd
from app.core.config import settings
from app.ml.features import extract_features
from app.ml.gate_math import calculate_epsilon_vc, evaluate_gate_level, locks_thresholds, gate_thresholds


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
        # Brief open question #1: n=1,570, d=28 must give epsilon ~0.32, not 0.042
        self.assertAlmostEqual(calculate_epsilon_vc(1570, 28), 0.324, places=3)

    def test_epsilon_defaults_to_configured_capacity(self):
        self.assertEqual(calculate_epsilon_vc(5000), calculate_epsilon_vc(5000, settings.CAPACITY_D))

    def test_evaluate_gate_level_locks_failure(self):
        res = _evaluate()
        self.assertFalse(res["locks"]["lock_samples"])
        self.assertEqual(res["held_by_lock"], "lock_samples")
        self.assertLessEqual(res["gate_level"], settings.JAR_GATE_CAP)

    def test_proven_floor_is_min_of_vc_and_bootstrap(self):
        res = _evaluate()
        self.assertEqual(res["proven_floor"], min(res["floor_vc"], res["auc_boot_lower"]))

    def test_gate_is_driven_by_proven_floor_not_auc(self):
        # High AUC but a small sample: VC penalty pushes the floor below chance, so water level stays 0
        res = _evaluate(auc_mean=0.95)
        self.assertLess(res["proven_floor"], settings.AUC_FLOOR)
        self.assertEqual(res["raw_gate_level"], 0.0)
        self.assertEqual(res["gate_level"], 0.0)

    def test_gate_formula(self):
        res = _evaluate(n_samples=200_000, n_positive=60_000, auc_mean=0.58)
        expected = np.clip((res["proven_floor"] - settings.AUC_FLOOR) / (settings.AUC_TARGET - settings.AUC_FLOOR), 0, 1)
        self.assertAlmostEqual(res["raw_gate_level"], expected, places=3)

    def test_four_locks_all_pass(self):
        y_true, y_pred = _perfect_preds(1000, 1000)
        res = evaluate_gate_level(
            auc_mean=0.68,
            auc_std=0.02,
            n_samples=2500,
            n_positive=300,
            y_true=y_true,
            y_pred_proba=y_pred,
            time_split_gap=0.02,
            d=settings.CAPACITY_D
        )
        self.assertTrue(res["locks"]["lock_samples"])
        self.assertTrue(res["locks"]["lock_cleared"])
        self.assertTrue(res["locks"]["lock_stability"])
        self.assertTrue(res["locks"]["lock_no_lookahead"])
        self.assertIsNone(res["held_by_lock"])

if __name__ == "__main__":
    unittest.main()
