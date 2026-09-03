import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk.js';
import type { HttpClient, HttpResponse } from '../src/http/types.js';
import { LilyConfigError } from '../src/errors/sdk-error.js';

function createMockHttpClient(): HttpClient {
  return {
    request: <TResponse>(): Promise<HttpResponse<TResponse>> =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {} as TResponse,
      }),
  };
}

describe('LilySdk composition', () => {
  it('routes injected HttpClient to all five clients', () => {
    const http = createMockHttpClient();
    const sdk = new LilySdk({ baseUrl: 'https://api.example.com' }, http);

    const agentsHttp = (sdk.agents as unknown as { httpClient: HttpClient })
      .httpClient;
    const walletsHttp = (sdk.wallets as unknown as { httpClient: HttpClient })
      .httpClient;
    const paymentsHttp = (sdk.payments as unknown as { httpClient: HttpClient })
      .httpClient;
    const identityHttp = (sdk.identity as unknown as { httpClient: HttpClient })
      .httpClient;
    const systemHttp = (sdk.system as unknown as { httpClient: HttpClient })
      .httpClient;

    expect(agentsHttp).toBe(http);
    expect(walletsHttp).toBe(http);
    expect(paymentsHttp).toBe(http);
    expect(identityHttp).toBe(http);
    expect(systemHttp).toBe(http);
  });

  it('default construction creates a fetch client from resolved config', () => {
    const sdk = new LilySdk({ baseUrl: 'https://api.example.com' });

    expect(sdk.agents).toBeDefined();
    expect(sdk.wallets).toBeDefined();
    expect(sdk.payments).toBeDefined();
    expect(sdk.identity).toBeDefined();
    expect(sdk.system).toBeDefined();
    expect(sdk.config.baseUrl.toString()).toBe('https://api.example.com/');
  });

  it('throws LilyConfigError for invalid config before constructing clients', () => {
    expect(() => new LilySdk({ baseUrl: '' })).toThrow(LilyConfigError);
    expect(() => new LilySdk({ baseUrl: 'not-a-url' })).toThrow(
      LilyConfigError,
    );
  });

  it('creates an instance via LilySdk.create() with zero-config defaults', () => {
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://api.lilyprotocol.com/');
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
      expect(sdk.config.baseUrl.toString()).toBe(
        'https://custom-env.lily.test/',
      );
      expect(sdk.config.apiKey).toBe('env_secret_key_123');
    } finally {
      process.env.LILY_BASE_URL = originalUrl;
      process.env.LILY_API_KEY = originalKey;
    }
  });

  it('exposes a default HttpClient when none is injected', () => {
    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(typeof sdk.http.request).toBe('function');
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

    expect(requests[0]?.url).toBe('https://api.lily.test/v1/system/health');
    expect(requests[0]?.headers.get('x-api-key')).toBe('root-key');
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer root-token');
    expect(requests[1]?.url).toBe(
      'https://tenant.lily.test/v1/v1/system/health',
    );
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

  it('constructs with new LilySdk() when only LILY_BASE_URL is set in environment', () => {
    vi.stubEnv('LILY_BASE_URL', 'https://base-only.lily.test');
    delete process.env.LILY_API_URL;

    const sdk = new LilySdk({ apiKey: 'key_123' });
    expect(sdk.config.baseUrl.toString()).toBe('https://base-only.lily.test/');
    expect(sdk.config.apiKey).toBe('key_123');
  });

  it('prefers LILY_API_URL over LILY_BASE_URL in new LilySdk()', () => {
    vi.stubEnv('LILY_API_URL', 'https://api-priority.lily.test');
    vi.stubEnv('LILY_BASE_URL', 'https://base-fallback.lily.test');

    const sdk = new LilySdk();
    expect(sdk.config.baseUrl.toString()).toBe(
      'https://api-priority.lily.test/',
    );
  });

  it('prefers explicit baseUrl over LILY_BASE_URL in new LilySdk()', () => {
    vi.stubEnv('LILY_BASE_URL', 'https://base-env.lily.test');

    const sdk = new LilySdk({ baseUrl: 'https://explicit-override.lily.test' });
    expect(sdk.config.baseUrl.toString()).toBe(
      'https://explicit-override.lily.test/',
    );
  });

  it('creates an instance via LilySdk.create() when only LILY_BASE_URL is set', () => {
    vi.stubEnv('LILY_BASE_URL', 'https://create-base.lily.test');
    delete process.env.LILY_API_URL;

    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://create-base.lily.test/');
  });

  it('prefers LILY_API_URL over LILY_BASE_URL in LilySdk.create()', () => {
    vi.stubEnv('LILY_API_URL', 'https://create-api.lily.test');
    vi.stubEnv('LILY_BASE_URL', 'https://create-base.lily.test');

    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://create-api.lily.test/');
  });
});
