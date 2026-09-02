import { describe, expect, it, vi } from 'vitest';

import { LilyApiError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('retry exhaustion', () => {
  it('retries retries + 1 times and throws LilyApiError with the final status code', async () => {
    const fetchSpy = vi.fn((_input: URL | RequestInfo, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'unavailable' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 2,
        retryDelayMs: 0,
        retryableStatusCodes: [503],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toBeInstanceOf(LilyApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(3);

    let rejection: unknown;
    try {
      await httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      });
    } catch (error) {
      rejection = error;
    }

    expect(rejection).toBeInstanceOf(LilyApiError);
    expect((rejection as LilyApiError).statusCode).toBe(503);
  });
});
