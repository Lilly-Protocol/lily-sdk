import unittest

class TestWave7SDKExponentialBackoff(unittest.TestCase):
    def test_exponential_backoff_delay_calculation(self):
        base_delay = 1.0
        max_delay = 16.0
        factor = 2.0

        def calculate_delay(attempt):
            return min(max_delay, base_delay * (factor ** attempt))

        self.assertEqual(calculate_delay(0), 1.0)
        self.assertEqual(calculate_delay(1), 2.0)
        self.assertEqual(calculate_delay(2), 4.0)
        self.assertEqual(calculate_delay(3), 8.0)
        self.assertEqual(calculate_delay(4), 16.0)
        self.assertEqual(calculate_delay(5), 16.0)

    def test_http_retryable_status_codes(self):
        retryable_codes = {429, 500, 502, 503, 504}
        self.assertTrue(429 in retryable_codes)
        self.assertTrue(503 in retryable_codes)
        self.assertFalse(400 in retryable_codes)
        self.assertFalse(404 in retryable_codes)

if __name__ == '__main__':
    unittest.main()
