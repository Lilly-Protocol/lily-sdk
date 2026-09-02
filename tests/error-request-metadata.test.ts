import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyApiError, LilyAuthenticationError, LilyTransportError } from '../src/errors/sdk-error';

describe('transport error request metadata', () => {
  const baseConfig = resolveLilySdkConfig({ baseUrl: 'https://api.example.com' });

  interface MockResponseInit {
    ok?: boolean;
    status?: number;
    headers?: HeadersInit;
    json?: unknown;
    text?: string;
  }

  function mockFetch(response: MockResponseInit): typeof fetch {
    const init: ResponseInit = {
      status: response.status ?? 200,
    };
    if (response.headers !== undefined) {
      init.headers = response.headers;
    }
    const res = new Response(JSON.stringify(response.json ?? ''), init);
    if (response.ok !== undefined) {
      Object.defineProperty(res, 'ok', { value: response.ok });
    }
    if (response.text !== undefined) {
      const textValue = response.text;
      res.text = () => Promise.resolve(textValue);
    }
    return vi.fn().mockResolvedValue(res);
  }

  it('attaches metadata to LilyApiError on non-retryable failure', async () => {
    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: mockFetch({ ok: false, status: 400, json: { message: 'bad' } }),
    });

    try {
      await client.request({ method: 'POST', path: '/payments', body: { amount: 10 } });
      expect.fail('should have thrown');
    } catch (err) {
      if (!(err instanceof LilyApiError)) throw err;
      expect(err.request).toEqual({
        method: 'POST',
        path: '/payments',
        url: 'https://api.example.com/payments',
      });
    }
  });

  it('attaches metadata to LilyAuthenticationError on 401', async () => {
    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: mockFetch({ ok: false, status: 401, json: { error: 'unauthorized' } }),
    });

    try {
      await client.request({ method: 'GET', path: '/wallet/me' });
      expect.fail('should have thrown');
    } catch (err) {
      if (!(err instanceof LilyAuthenticationError)) throw err;
      expect(err.request?.path).toBe('/wallet/me');
      expect(err.request?.method).toBe('GET');
    }
  });

  it('attaches metadata to LilyTransportError on network failure', async () => {
    const networkFail = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createFetchHttpClient({
      ...baseConfig,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      fetch: networkFail as typeof fetch,
    });

    try {
      await client.request({ method: 'GET', path: '/health' });
      expect.fail('should have thrown');
    } catch (err) {
      if (!(err instanceof LilyTransportError)) throw err;
      expect(err.request?.url).toContain('/health');
      expect(err.code).toBe('TRANSPORT_ERROR');
    }
  }, 10000);
});
