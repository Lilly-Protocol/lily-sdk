import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import type { HttpRequest } from '../src/http/types';

describe('concurrent http client stress test (#103)', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = vi.fn();
    config = {
      baseUrl: new URL('https://api.example.com'),
      apiKey: 'test-key',
      authToken: '',
      timeoutMs: 1000,
      userAgent: 'lily-sdk-test',
      defaultHeaders: {},
      fetch: mockFetch as unknown as typeof fetch,
      retry: {
        retries: 2,
        retryDelayMs: 100,
      },
    } as unknown as ResolvedLilySdkConfig;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles concurrent requests with isolated timeouts and retries', async () => {
    const requestCount = 10;
    const responses: { status: number; ok: boolean; headers: Headers; json: () => Promise<unknown> }[] = [];

    for (let i = 0; i < requestCount; i++) {
      responses.push({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ requestId: i, timestamp: Date.now() }),
      });
    }

    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      const signal = init.signal ?? new AbortController().signal;
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      return responses.shift() as Response;
    });

    const client = createFetchHttpClient(config);
    const requests: Promise<unknown>[] = [];

    for (let i = 0; i < requestCount; i++) {
      const req: HttpRequest = {
        method: 'GET',
        path: `/test/${String(i)}`,
        timeoutMs: 1000,
      };
      requests.push(client.request(req));
    }

    for (let i = 0; i < requestCount * 10; i++) {
      await vi.advanceTimersByTimeAsync(50);
    }

    const results = await Promise.all(requests);

    expect(results).toHaveLength(requestCount);
    expect(mockFetch).toHaveBeenCalledTimes(requestCount);

    const requestIds = new Set<number>();
    for (const result of results) {
      const data = (result as { data: { requestId: number } }).data;
      expect(data.requestId).toBeGreaterThanOrEqual(0);
      expect(data.requestId).toBeLessThan(requestCount);
      requestIds.add(data.requestId);
    }
    expect(requestIds.size).toBe(requestCount);
  });

  it('isolates retry state across concurrent failing requests', async () => {
    const requestCount = 5;
    let callCount = 0;

    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      callCount++;
      const signal = init.signal ?? new AbortController().signal;
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      await new Promise((resolve) => setTimeout(resolve, 30));
      if (callCount % 2 === 1) {
        return {
          status: 500,
          ok: false,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ error: 'server error' }),
        } as Response;
      }
      return {
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true, attempt: callCount }),
      } as Response;
    });

    const client = createFetchHttpClient(config);
    const requests: Promise<unknown>[] = [];

    for (let i = 0; i < requestCount; i++) {
      const req: HttpRequest = {
        method: 'GET',
        path: `/retry/${String(i)}`,
        timeoutMs: 1000,
      };
      requests.push(client.request(req));
    }

    for (let i = 0; i < 50; i++) {
      await vi.advanceTimersByTimeAsync(100);
    }

    const results = await Promise.all(requests);

    expect(results).toHaveLength(requestCount);
    expect(mockFetch).toHaveBeenCalledTimes(requestCount * 2);

    for (const result of results) {
      const data = (result as { data: { success: boolean } }).data;
      expect(data.success).toBe(true);
    }
  });
});
