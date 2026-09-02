import { describe, expect, it } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('LilySdk', () => {
  it('constructs all client modules with shared config', () => {
    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(() =>
        Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: { ok: true },
        }),
      ),
    );

    expect(sdk.config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(sdk.agents).toBeDefined();
    expect(sdk.wallets).toBeDefined();
    expect(sdk.payments).toBeDefined();
    expect(sdk.identity).toBeDefined();
    expect(sdk.system).toBeDefined();
  });

  it('creates an instance via LilySdk.create() with zero-config defaults', () => {
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://api.lilyprotocol.org/');
    expect(sdk.agents).toBeDefined();
    expect(sdk.wallets).toBeDefined();
    expect(sdk.payments).toBeDefined();
  });

  it('creates an instance via LilySdk.create() reading environment variables', () => {
    const originalUrl = process.env.LILY_BASE_URL;
    const originalKey = process.env.LILY_API_KEY;

    try {
      process.env.LILY_BASE_URL = 'https://custom-env.lily.test';
      process.env.LILY_API_KEY = 'env_secret_key_123';

      const sdk = LilySdk.create();
      expect(sdk.config.baseUrl.toString()).toBe('https://custom-env.lily.test/');
      expect(sdk.config.apiKey).toBe('env_secret_key_123');
    } finally {
      process.env.LILY_BASE_URL = originalUrl;
      process.env.LILY_API_KEY = originalKey;
    }
  });
});

