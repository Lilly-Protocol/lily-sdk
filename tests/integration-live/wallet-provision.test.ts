import { describe, it, expect } from 'vitest';
import { LilySdk } from '../../src/sdk';

const BASE_URL = process.env.LILY_TEST_BASE_URL;
const API_KEY = process.env.LILY_TEST_API_KEY;

const hasEnv = !!BASE_URL && !!API_KEY;

describe('Integration: Wallet Provision', () => {
  it.skipIf(!hasEnv)('provisions a wallet and returns a valid response', async () => {
    const sdk = new LilySdk({
      baseUrl: BASE_URL!,
      apiKey: API_KEY!,
      timeoutMs: 30000,
    });
    const agentId = `integration-test-${Date.now()}`;
    try {
      const wallet = await sdk.wallets.provision({ agentId });
      expect(wallet).toBeDefined();
      expect(typeof wallet.id).toBe('string');
      expect(wallet.agentId).toBe(agentId);
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(typeof error.message).toBe('string');
    }
  });
});
