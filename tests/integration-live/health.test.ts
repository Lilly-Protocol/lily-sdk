import { describe, it, expect } from 'vitest';
import { LilySdk } from '../../src/sdk';

const BASE_URL = process.env.LILY_TEST_BASE_URL;
const API_KEY = process.env.LILY_TEST_API_KEY;

const hasEnv = !!BASE_URL && !!API_KEY;

describe('Integration: System Health', () => {
  it.skipIf(!hasEnv)('returns a valid health status from live backend', async () => {
    const sdk = new LilySdk({
      baseUrl: BASE_URL!,
      apiKey: API_KEY!,
      timeoutMs: 30000,
    });
    const health = await sdk.system.health();
    expect(health).toBeDefined();
    expect(typeof health.status).toBe('string');
    expect(['ok', 'degraded', 'down']).toContain(health.status);
  });
});
