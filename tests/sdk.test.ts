import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk.js';
import type { HttpClient, HttpResponse } from '../src/http/types.js';
import { LilyConfigError } from '../src/errors/sdk-error.js';

function createMockHttpClient(): HttpClient {
  return {
    request: <TResponse>(): Promise<HttpResponse<TResponse>> => Promise.resolve({
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

    const agentsHttp = (sdk.agents as unknown as { httpClient: HttpClient }).httpClient;
    const walletsHttp = (sdk.wallets as unknown as { httpClient: HttpClient }).httpClient;
    const paymentsHttp = (sdk.payments as unknown as { httpClient: HttpClient }).httpClient;
    const identityHttp = (sdk.identity as unknown as { httpClient: HttpClient }).httpClient;
    const systemHttp = (sdk.system as unknown as { httpClient: HttpClient }).httpClient;

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
    expect(() => new LilySdk({ baseUrl: 'not-a-url' })).toThrow(LilyConfigError);
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

