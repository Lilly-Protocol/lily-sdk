import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import {
  LilyApiError,
  LilyAuthenticationError,
} from '../src/errors/sdk-error';

describe('response headers on errors (issue #414)', () => {
  const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com' });

  function mockFetch(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
    return vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', ...extraHeaders },
      }),
    );
  }

  it('includes response headers in LilyAuthenticationError', async () => {
    const fetch = mockFetch({ error: 'unauthorized' }, 401, {
      'x-request-id': 'req-123',
      'retry-after': '5',
    });
    const client = createFetchHttpClient({ ...config, fetch: fetch as any });

    try {
      await client.request({ method: 'GET', path: '/wallet/me' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const e = err as LilyAuthenticationError;
      expect(e.headers).toBeDefined();
      expect(e.headers!['x-request-id']).toBe('req-123');
      expect(e.toJSON()).toMatchObject({ headers: { 'x-request-id': 'req-123' } });
    }
  });

  it('includes response headers in LilyApiError', async () => {
    const fetch = mockFetch({ message: 'internal error' }, 500, {
      'x-request-id': 'req-456',
    });
    const client = createFetchHttpClient({
      ...config,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      fetch: fetch as any,
    });

    try {
      await client.request({ method: 'POST', path: '/payments' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const e = err as LilyApiError;
      expect(e.headers).toBeDefined();
      expect(e.headers!['x-request-id']).toBe('req-456');
      expect(e.toJSON()).toMatchObject({ headers: { 'x-request-id': 'req-456' } });
    }
  });
});
