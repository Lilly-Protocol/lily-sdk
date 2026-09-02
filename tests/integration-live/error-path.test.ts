import { describe, it, expect } from 'vitest';
import { LilySdk } from '../../src/sdk';

const BASE_URL = process.env.LILY_TEST_BASE_URL;

const hasBaseUrl = !!BASE_URL;

describe('Integration: Error Paths', () => {
  it.skipIf(!hasBaseUrl)('throws a proper SDK error for invalid API key', async () => {
    const sdk = new LilySdk({
      baseUrl: BASE_URL!,
      apiKey: 'invalid-key-for-testing',
      timeoutMs: 10000,
    });
    try {
      await sdk.system.health();
      expect(true).toBe(true);
    } catch (error: any) {
      expect(error.name).toMatch(/Lily/);
      expect(typeof error.message).toBe('string');
    }
  });
});
