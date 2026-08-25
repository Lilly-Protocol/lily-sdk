import { afterEach, describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('LilySdk', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it('creates an SDK using environment configuration', () => {
    vi.stubEnv('LILY_API_URL', 'https://environment.lily.test');
    vi.stubEnv('LILY_API_KEY', 'environment-key');
    vi.stubEnv('LILY_AUTH_TOKEN', 'environment-token');

    const sdk = LilySdk.create();

    expect(sdk.config.baseUrl.toString()).toBe(
      'https://environment.lily.test/',
    );
    expect(sdk.config.apiKey).toBe('environment-key');
    expect(sdk.config.authToken).toBe('environment-token');
  });

  it('gives explicit create options precedence over environment configuration', () => {
    vi.stubEnv('LILY_API_URL', 'https://environment.lily.test');
    vi.stubEnv('LILY_API_KEY', 'environment-key');
    vi.stubEnv('LILY_AUTH_TOKEN', 'environment-token');

    const sdk = LilySdk.create({
      baseUrl: 'https://explicit.lily.test',
      apiKey: 'explicit-key',
      authToken: 'explicit-token',
    });

    expect(sdk.config.baseUrl.toString()).toBe('https://explicit.lily.test/');
    expect(sdk.config.apiKey).toBe('explicit-key');
    expect(sdk.config.authToken).toBe('explicit-token');
  });
});
