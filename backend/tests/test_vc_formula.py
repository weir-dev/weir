import unittest
import math

CAPACITY_D = 37
DELTA_CONFIDENCE = 0.05

def calculate_epsilon_vc(n: int, d: int = CAPACITY_D, delta: float = DELTA_CONFIDENCE) -> float:
    if n <= d or n <= 0:
        return 1.0
    term1 = d * (math.log(2.0 * n / d) + 1.0)
    term2 = math.log(4.0 / delta)
    val = (term1 + term2) / n
    return math.sqrt(val) if val > 0 else 0.0

class TestVCFormula(unittest.TestCase):
    def test_vc_epsilon_calculation(self):
        eps = calculate_epsilon_vc(340, 28)
        self.assertTrue(0.0 < eps < 1.0)

    def test_vc_epsilon_matches_brief_audit(self):
        # Brief audit: n=1,570, d=28 gives epsilon ~0.324
        self.assertAlmostEqual(calculate_epsilon_vc(1570, 28), 0.324, places=3)

    def test_epsilon_defaults_to_configured_capacity(self):
        self.assertEqual(calculate_epsilon_vc(5000), calculate_epsilon_vc(5000, CAPACITY_D))

if __name__ == "__main__":
    unittest.main()
