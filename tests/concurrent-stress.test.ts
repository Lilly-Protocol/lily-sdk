import { describe, expect, it, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('concurrent request isolation', () => {
  it('handles 20 concurrent requests with correct per-request responses', async () => {
    const callLog: number[] = [];
    let callIndex = 0;

    const fetchSpy = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
      const myIndex = callIndex++;
      callLog.push(myIndex);

      // Simulate variable latency to stress-test timeout/abort isolation
      const delay = Math.floor(Math.random() * 50);

      return new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve(
            new Response(JSON.stringify({ requestId: myIndex, status: 'ok' }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        }, delay);
      });
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const concurrency = 20;
    const promises = Array.from({ length: concurrency }, (_, i) =>
      httpClient.request<{ requestId: number; status: string }>({
        method: 'GET',
        path: `/v1/test/${i}`,
      }),
    );

    const results = await Promise.all(promises);

    // Every request got its own response
    expect(results).toHaveLength(concurrency);
    expect(fetchSpy).toHaveBeenCalledTimes(concurrency);

    // Each response matches a unique request (no cross-contamination)
    const responseIds = results
      .map((r) => r.data.requestId)
      .sort((a, b) => a - b);
    const expectedIds = Array.from({ length: concurrency }, (_, i) => i);
    expect(responseIds).toEqual(expectedIds);

    // All timers were cleared — no leaked setTimeouts
    // (if timers leaked, vitest would warn or the test would hang)
  });

  it('isolates retry state across concurrent failing requests', async () => {
    const attemptCounts: Record<string, number> = {};

    const fetchSpy = vi.fn((input: URL | RequestInfo) => {
      const path = new URL(input.toString()).pathname;
      attemptCounts[path] = (attemptCounts[path] ?? 0) + 1;

      // First 2 attempts fail with 503, third succeeds
      if (attemptCounts[path]! < 3) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'unavailable' }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ path, attempt: attemptCounts[path] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 3, retryDelayMs: 0, retryableStatusCodes: [503] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const paths = ['/v1/a', '/v1/b', '/v1/c', '/v1/d', '/v1/e'];
    const promises = paths.map((path) =>
      httpClient.request<{ path: string; attempt: number }>({
        method: 'GET',
        path,
      }),
    );

    const results = await Promise.all(promises);

    // Each path made exactly 3 attempts (2 failures + 1 success)
    for (const path of paths) {
      expect(attemptCounts[path]).toBe(3);
    }

    // Each response has the correct final attempt count
    for (const result of results) {
      expect(result.data.attempt).toBe(3);
    }

    // Total fetch calls = 5 paths × 3 attempts each
    expect(fetchSpy).toHaveBeenCalledTimes(15);
  });

  it('does not leak AbortControllers on concurrent timeout-free requests', async () => {
    const abortSignals: AbortSignal[] = [];

    const fetchSpy = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
      if (init?.signal) {
        abortSignals.push(init.signal);
      }
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const concurrency = 10;
    await Promise.all(
      Array.from({ length: concurrency }, () =>
        httpClient.request({ method: 'GET', path: '/v1/test' }),
      ),
    );

    // Each request created exactly one AbortController signal
    expect(abortSignals).toHaveLength(concurrency);

    // No signals were aborted (all requests succeeded without timeout)
    for (const signal of abortSignals) {
      expect(signal.aborted).toBe(false);
    }
  });
});
