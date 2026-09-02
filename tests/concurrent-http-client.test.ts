import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('concurrent http client stress test', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles concurrent requests with isolated timeouts and retries', async () => {
    const requestCount = 10;
    let callIndex = 0;

    const fetchSpy = vi.fn(async (_input: URL | RequestInfo, init?: RequestInit) => {
      const index = callIndex++;
      await new Promise((resolve) => setTimeout(resolve, (index + 1) * 10));

      if (init?.signal?.aborted) {
        throw new Error('Aborted');
      }

      return new Response(
        JSON.stringify({ id: index, status: 'ok' }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 500,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const promises = Array.from({ length: requestCount }, (_, i) =>
      httpClient.request<{ id: number; status: string }>({
        method: 'GET',
        path: `/v1/resource/${String(i)}`,
      }),
    );

    await vi.runAllTimersAsync();

    const results = await Promise.all(promises);

    expect(results).toHaveLength(requestCount);
    expect(fetchSpy).toHaveBeenCalledTimes(requestCount);

    for (let i = 0; i < requestCount; i++) {
      expect(results[i]?.data.id).toBe(i);
      expect(results[i]?.status).toBe(200);
    }

    expect(vi.getTimerCount()).toBe(0);
  });

  it('isolates retry state across concurrent failing requests', async () => {
    const attemptsPerRequest: number[] = [];
    let callIndex = 0;

    const fetchSpy = vi.fn(async () => {
      const currentCall = callIndex++;
      attemptsPerRequest[currentCall] = (attemptsPerRequest[currentCall] ?? 0) + 1;

      const isFirstAttempt = currentCall < 3;

      await new Promise((resolve) => setTimeout(resolve, 10));

      if (isFirstAttempt) {
        return new Response(JSON.stringify({ error: 'temp' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ recovered: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 500,
      retry: { retries: 1, retryDelayMs: 5, retryableStatusCodes: [500] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const promises = Array.from({ length: 3 }, () =>
      httpClient.request<{ recovered: boolean }>({
        method: 'GET',
        path: '/v1/flaky',
      }),
    );

    await vi.runAllTimersAsync();
    const results = await Promise.all(promises);

    expect(results.every((r) => r.data.recovered)).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(6);
    expect(vi.getTimerCount()).toBe(0);
  });
});
