import { describe, it, expect } from 'vitest';
import { LilySdk, DEFAULT_API_URL } from '../src/sdk';

describe('DEFAULT_API_URL canonical constant (issue #408)', () => {
  it('is exported and equals the canonical URL', () => {
    expect(DEFAULT_API_URL).toBe('https://api.lilyprotocol.com');
  });

  it('LilySdk.create() without options falls back to DEFAULT_API_URL when no env var is set', () => {
    const originalEnv = process.env.LILY_API_URL;
    delete process.env.LILY_API_URL;
    try {
      const sdk = LilySdk.create();
      expect(sdk.config.baseUrl.toString()).toBe('https://api.lilyprotocol.com/');
    } finally {
      if (originalEnv !== undefined) process.env.LILY_API_URL = originalEnv;
      else delete process.env.LILY_API_URL;
    }
  });
});
