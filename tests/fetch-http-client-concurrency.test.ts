import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('fetch HTTP client concurrency', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps retry and timeout state isolated across concurrent requests', async () => {
    vi.useFakeTimers();

    const requestCount = 12;
    const attempts = new Map<string, number>();
    const fetchMock = vi.fn((input: URL | RequestInfo) => {
      const url = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      const requestId = url.searchParams.get('requestId');

      if (requestId === null) {
        throw new Error('Expected a requestId query parameter');
      }

      const attempt = (attempts.get(requestId) ?? 0) + 1;
      attempts.set(requestId, attempt);

      return new Promise<Response>((resolve) => {
        // Resolve requests out of order so their retry delays and timeout timers overlap.
        const staggerMs = (requestCount - Number(requestId)) * 3;
        setTimeout(() => {
          resolve(
            new Response(
              JSON.stringify(
                attempt === 1
                  ? { requestId, retry: true }
                  : { requestId, attempt },
              ),
              {
                status: attempt === 1 ? 503 : 200,
                headers: { 'content-type': 'application/json' },
              },
            ),
          );
        }, staggerMs);
      });
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 1_000,
      retry: {
        retries: 1,
        retryDelayMs: 25,
        retryableStatusCodes: [503],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchMock,
    });

    const responsesPromise = Promise.all(
      Array.from({ length: requestCount }, (_, requestId) =>
        httpClient.request<{ requestId: string; attempt: number }>({
          method: 'GET',
          path: '/v1/system/health',
          query: { requestId },
        }),
      ),
    );

    await vi.runAllTimersAsync();
    const responses = await responsesPromise;

    expect(responses.map(({ data }) => data)).toEqual(
      Array.from({ length: requestCount }, (_, requestId) => ({
        requestId: String(requestId),
        attempt: 2,
      })),
    );
    expect(Object.fromEntries(attempts)).toEqual(
      Object.fromEntries(
        Array.from({ length: requestCount }, (_, requestId) => [
          String(requestId),
          2,
        ]),
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(requestCount * 2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
