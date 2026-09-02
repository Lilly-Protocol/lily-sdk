import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function makeConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: undefined,
    authToken: undefined,
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    timeoutMs: 1000,
    fetch: overrides.fetch ?? vi.fn(),
    retry: {
      retries: 3,
      retryDelayMs: 10,
      retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
    },
    ...overrides,
  } as ResolvedLilySdkConfig;
}

describe('fetch-http-client retry on 429 then success', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries once after 429 and returns the subsequent 200 response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const config = makeConfig({ fetch: fetchMock });
    const client = createFetchHttpClient(config);

    const promise = client.request({ method: 'GET', path: '/test' });

    // First attempt fails with 429, delay is retryDelayMs * 1 = 10ms
    await vi.advanceTimersByTimeAsync(10);

    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ ok: true });
  });
});
