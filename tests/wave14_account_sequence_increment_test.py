import unittest

class TestWave14AccountSequenceIncrement(unittest.TestCase):
    def test_stellar_sequence_monotonic_increment(self):
        def get_next_sequence_number(current_seq: int) -> int:
            return current_seq + 1

        initial_seq = 123456789012345
        next_seq = get_next_sequence_number(initial_seq)
        self.assertEqual(next_seq, 123456789012346)
        self.assertTrue(next_seq > initial_seq)

    def test_sequence_number_positive_int64(self):
        def is_valid_sequence(seq: int) -> bool:
            return seq > 0 and seq <= (1 << 63) - 1

        self.assertTrue(is_valid_sequence(100))
        self.assertFalse(is_valid_sequence(0))
        self.assertFalse(is_valid_sequence(-50))

if __name__ == '__main__':
    unittest.main()
