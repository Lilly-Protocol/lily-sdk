import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client.js';
import type { ResolvedLilySdkConfig } from '../src/config/types.js';
import {
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
} from '../src/errors/sdk-error.js';

function makeConfig(fetchImpl: typeof fetch): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com/'),
    timeoutMs: 1000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: Object.freeze({}),
    userAgent: 'test-agent',
    fetch: fetchImpl,
  };
}

describe('transport errors include request metadata', () => {
  it('attaches method, path, and url to LilyApiError', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'POST', path: '/v1/payments' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const apiErr = err as LilyApiError;
      expect(apiErr.request).toEqual({
        method: 'POST',
        path: '/v1/payments',
        url: 'https://api.example.com/v1/payments',
      });
    }
  });

  it('attaches metadata to LilyAuthenticationError on 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('', { status: 401 }),
    );
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'GET', path: '/v1/agents' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const authErr = err as LilyAuthenticationError;
      expect(authErr.request?.method).toBe('GET');
      expect(authErr.request?.path).toBe('/v1/agents');
      expect(authErr.request?.url).toBe('https://api.example.com/v1/agents');
    }
  });

  it('attaches metadata to LilyTransportError on timeout', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise<Response>((_, reject) => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'DELETE', path: '/v1/wallets/w1' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      const tErr = err as LilyTransportError;
      expect(tErr.code).toBe('TIMEOUT');
      expect(tErr.request?.method).toBe('DELETE');
      expect(tErr.request?.path).toBe('/v1/wallets/w1');
    }
  });

  it('attaches metadata to LilyTransportError on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = createFetchHttpClient(makeConfig(mockFetch));

    try {
      await client.request({ method: 'PUT', path: '/v1/identity' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      const tErr = err as LilyTransportError;
      expect(tErr.code).toBe('TRANSPORT_ERROR');
      expect(tErr.request?.method).toBe('PUT');
      expect(tErr.request?.path).toBe('/v1/identity');
      expect(tErr.request?.url).toContain('/v1/identity');
    }
  });
});
