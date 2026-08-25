import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';
import type { HttpClient, HttpRequest, HttpResponse } from '../src/http/types';

function createMockHttpClient(): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(
      request: HttpRequest<TRequest>,
    ): Promise<HttpResponse<TResponse>> {
      return {
        status: 200,
        headers: new Headers(),
        data: { received: true, method: request.method, path: request.path } as TResponse,
      };
    },
  };
}

describe('LilySdk.create() zero-config factory', () => {
  it('creates an instance with only an apiKey', () => {
    const sdk = LilySdk.create({ apiKey: 'test-key-123' });
    expect(sdk).toBeInstanceOf(LilySdk);
    expect(sdk.config.apiKey).toBe('test-key-123');
  });

  it('defaults baseUrl to https://api.lily-protocol.dev', () => {
    const sdk = LilySdk.create({ apiKey: 'k' });
    expect(sdk.config.baseUrl.href).toBe('https://api.lily-protocol.dev/');
  });

  it('allows overriding baseUrl', () => {
    const sdk = LilySdk.create({ apiKey: 'k', baseUrl: 'https://test.lily.dev' });
    expect(sdk.config.baseUrl.href).toBe('https://test.lily.dev/');
  });

  it('throws if neither apiKey nor authToken is provided', () => {
    expect(() => LilySdk.create({})).toThrow();
  });

  it('accepts authToken instead of apiKey', () => {
    const sdk = LilySdk.create({ authToken: 'Bearer abc' });
    expect(sdk.config.authToken).toBe('Bearer abc');
    expect(sdk.config.apiKey).toBeUndefined();
  });

  it('initializes all clients', () => {
    const sdk = LilySdk.create({ apiKey: 'k' });
    expect(sdk.agents).toBeDefined();
    expect(sdk.wallets).toBeDefined();
    expect(sdk.payments).toBeDefined();
    expect(sdk.identity).toBeDefined();
    expect(sdk.system).toBeDefined();
  });

  it('accepts a custom HttpClient', () => {
    const mock = createMockHttpClient();
    const sdk = LilySdk.create({ apiKey: 'k' }, mock);
    expect(sdk.config).toBeDefined();
  });
});
