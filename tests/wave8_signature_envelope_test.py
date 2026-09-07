import unittest

class TestWave8SignatureEnvelope(unittest.TestCase):
    def test_signature_payload_non_empty(self):
        def is_valid_envelope(signature: str, public_key: str) -> bool:
            return bool(signature and public_key and len(public_key) == 56)

        valid_pk = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
        dummy_sig = "a" * 128
        self.assertTrue(is_valid_envelope(dummy_sig, valid_pk))
        self.assertFalse(is_valid_envelope("", valid_pk))
        self.assertFalse(is_valid_envelope(dummy_sig, "short_key"))

if __name__ == '__main__':
    unittest.main()
