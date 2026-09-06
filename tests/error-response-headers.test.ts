import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import {
  LilyApiError,
  LilyAuthenticationError,
} from '../src/errors/sdk-error';
import { mapResponseError } from '../src/http/map-response-error';

describe('error response headers', () => {
  let config: ReturnType<typeof resolveLilySdkConfig>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    config = {
      ...resolveLilySdkConfig({
        baseUrl: 'https://api.example.com',
        retry: { retries: 0, retryDelayMs: 0 },
      }),
      fetch: fetchMock,
    } as ReturnType<typeof resolveLilySdkConfig>;
  });

  it('exposes headers on 500 LilyApiError and includes them in toJSON()', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'x-request-id': 'req-test-500',
          'content-type': 'application/json',
        },
      }),
    );
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'GET', path: '/test-server-error' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const e = err as LilyApiError;
      expect(e.headers).toBeDefined();
      expect(e.headers?.['x-request-id']).toBe('req-test-500');
      expect(e.toJSON().headers).toEqual(
        expect.objectContaining({
          'x-request-id': 'req-test-500',
        }),
      );
    }
  });

  it('exposes headers on 429 LilyRateLimitError and includes retry-after and x-request-id', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'x-request-id': 'req-rate-limit-429',
          'retry-after': '30',
          'content-type': 'application/json',
        },
      }),
    );
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'POST', path: '/test-rate-limit' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const e = err as LilyApiError;
      expect(e.headers).toBeDefined();
      expect(e.headers?.['x-request-id']).toBe('req-rate-limit-429');
      expect(e.headers?.['retry-after']).toBe('30');
      expect(e.toJSON().headers).toEqual(
        expect.objectContaining({
          'x-request-id': 'req-rate-limit-429',
          'retry-after': '30',
        }),
      );
    }
  });

  it('exposes headers on 401 LilyAuthenticationError', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'x-request-id': 'req-auth-401',
          'www-authenticate': 'Bearer realm="api"',
          'content-type': 'application/json',
        },
      }),
    );
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'GET', path: '/secure-data' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const e = err as LilyAuthenticationError;
      expect(e.headers).toBeDefined();
      expect(e.headers?.['x-request-id']).toBe('req-auth-401');
      expect(e.headers?.['www-authenticate']).toBe('Bearer realm="api"');
      expect(e.toJSON().headers).toEqual(
        expect.objectContaining({
          'x-request-id': 'req-auth-401',
          'www-authenticate': 'Bearer realm="api"',
        }),
      );
    }
  });

  it('includes headers when using mapResponseError directly', () => {
    const headers = new Headers({
      'x-request-id': 'req-mapped-404',
      'x-trace-id': 'trace-999',
    });
    const err = mapResponseError(404, { message: 'Not found' }, headers);
    expect(err.headers).toBeDefined();
    expect(err.headers?.['x-request-id']).toBe('req-mapped-404');
    expect(err.headers?.['x-trace-id']).toBe('trace-999');
    expect(err.toJSON().headers).toEqual({
      'x-request-id': 'req-mapped-404',
      'x-trace-id': 'trace-999',
    });
  });
});
