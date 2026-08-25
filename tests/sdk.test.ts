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

  it('creates an isolated SDK with merged tenant configuration', async () => {
    const requests: { url: string; headers: Headers }[] = [];
    const fetchMock: typeof fetch = (input, init) => {
      requests.push({
        url:
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url,
        headers: new Headers(init?.headers),
      });

      return Promise.resolve(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    };
    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.test',
      apiKey: 'root-key',
      authToken: 'root-token',
      timeoutMs: 1_234,
      retry: { retries: 4, retryDelayMs: 50 },
      fetch: fetchMock,
    });

    const tenantSdk = sdk.withConfig({
      baseUrl: 'https://tenant.lily.test/v1',
      apiKey: 'tenant-key',
      authToken: 'tenant-token',
      retry: { retries: 1 },
    });

    await sdk.system.health();
    await tenantSdk.system.health();

    expect(requests[0]?.url).toBe('https://api.lily.test/health');
    expect(requests[0]?.headers.get('x-api-key')).toBe('root-key');
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer root-token');
    expect(requests[1]?.url).toBe('https://tenant.lily.test/v1/health');
    expect(requests[1]?.headers.get('x-api-key')).toBe('tenant-key');
    expect(requests[1]?.headers.get('authorization')).toBe(
      'Bearer tenant-token',
    );
    expect(tenantSdk.config.timeoutMs).toBe(1_234);
    expect(tenantSdk.config.retry).toMatchObject({
      retries: 1,
      retryDelayMs: 50,
    });
    expect(sdk.config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(sdk.config.apiKey).toBe('root-key');
    expect(sdk.config.authToken).toBe('root-token');
    expect(sdk.config.retry.retries).toBe(4);
    expect(tenantSdk).not.toBe(sdk);
    expect(tenantSdk.system).not.toBe(sdk.system);
  });
});
