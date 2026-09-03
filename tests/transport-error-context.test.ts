import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyApiError, LilyAuthenticationError, LilyTransportError } from '../src/errors/sdk-error';

function makeConfig(fetchImpl: typeof fetch) {
  return resolveLilySdkConfig({
    baseUrl: 'https://api.example.com',
    apiKey: 'test-key',
    retry: { retries: 0 },
    fetch: fetchImpl,
  });
}

describe('transport error request context', () => {
  it('attaches request metadata to LilyAuthenticationError on 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'unauthorized' }),
      text: async () => '{"message":"unauthorized"}',
    });
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'GET', path: '/wallets/wal_1' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const e = err as LilyAuthenticationError;
      expect(e.request).toBeDefined();
      expect(e.request!.method).toBe('GET');
      expect(e.request!.path).toBe('/wallets/wal_1');
      expect(e.request!.url).toContain('/wallets/wal_1');
    }
  });

  it('attaches request metadata to LilyApiError on non-retryable failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'invalid' }),
      text: async () => '{"message":"invalid"}',
    });
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'POST', path: '/payments', body: {} });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const e = err as LilyApiError;
      expect(e.request).toBeDefined();
      expect(e.request!.method).toBe('POST');
      expect(e.request!.path).toBe('/payments');
      expect(e.request!.url).toContain('/payments');
    }
  });

  it('attaches request metadata to LilyTransportError on timeout', async () => {
    const mockFetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const abortErr = new Error('The operation was aborted');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      timeoutMs: 50,
      retry: { retries: 0 },
      fetch: mockFetch,
    });
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'GET', path: '/health' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      const e = err as LilyTransportError;
      expect(e.code).toBe('TIMEOUT');
      expect(e.request).toBeDefined();
      expect(e.request!.method).toBe('GET');
      expect(e.request!.path).toBe('/health');
    }
  });

  it('attaches request metadata to LilyTransportError on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'DELETE', path: '/agents/ag_1' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      const e = err as LilyTransportError;
      expect(e.code).toBe('TRANSPORT_ERROR');
      expect(e.request).toBeDefined();
      expect(e.request!.method).toBe('DELETE');
      expect(e.request!.path).toBe('/agents/ag_1');
      expect(e.request!.url).toContain('/agents/ag_1');
    }
  });
});
