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
});
