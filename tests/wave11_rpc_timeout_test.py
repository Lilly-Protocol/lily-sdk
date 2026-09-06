import unittest

class TestWave11RPCTransportTimeout(unittest.TestCase):
    def test_rpc_timeout_clamping(self):
        default_timeout_sec = 15
        max_timeout_sec = 60
        min_timeout_sec = 2

        def clamp_timeout(requested: int) -> int:
            if requested <= 0:
                return default_timeout_sec
            return max(min_timeout_sec, min(max_timeout_sec, requested))

        self.assertEqual(clamp_timeout(0), 15)
        self.assertEqual(clamp_timeout(1), 2)
        self.assertEqual(clamp_timeout(30), 30)
        self.assertEqual(clamp_timeout(100), 60)

    def test_rpc_endpoint_url_protocol_scheme(self):
        def is_secure_endpoint(url: str) -> bool:
            return url.startswith("https://") or url.startswith("wss://")

        self.assertTrue(is_secure_endpoint("https://soroban-rpc.mainnet.stellar.org"))
        self.assertTrue(is_secure_endpoint("wss://soroban-events.stellar.org"))
        self.assertFalse(is_secure_endpoint("http://unencrypted-node.net"))

if __name__ == '__main__':
    unittest.main()
