import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function makeConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: 'test-key',
    authToken: undefined,
    timeoutMs: 5000,
    userAgent: 'test-agent',
    defaultHeaders: {},
    retry: { retries: 2, retryDelayMs: 10, retryableStatusCodes: [429, 500] },
    fetch: vi.fn(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

function mockResponse(status: number, ok: boolean, body: Record<string, unknown>) {
  const jsonStr = JSON.stringify(body);
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ ...body }),
    text: async () => jsonStr,
  };
}

describe('HttpResponse retry metadata', () => {
  it('returns attempts=1 and retried=false on first-try success', async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(200, true, { ok: true }));
    const config = makeConfig({ fetch: mockFetch });
    const client = createFetchHttpClient(config);

    const resp = await client.request({ method: 'GET', path: '/test' });

    expect(resp.attempts).toBe(1);
    expect(resp.retried).toBe(false);
    expect(resp.data).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns attempts>1 and retried=true after successful retry', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(mockResponse(429, false, { error: 'rate limited' }))
      .mockResolvedValueOnce(mockResponse(200, true, { ok: true }));
    const config = makeConfig({ fetch: mockFetch });
    const client = createFetchHttpClient(config);

    const resp = await client.request({ method: 'GET', path: '/test' });

    expect(resp.attempts).toBe(2);
    expect(resp.retried).toBe(true);
    expect(resp.data).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
