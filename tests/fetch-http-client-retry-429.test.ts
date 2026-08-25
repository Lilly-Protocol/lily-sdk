import { describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createConfig(overrides: Record<string, unknown> = {}) {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 2,
      retryDelayMs: 0,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: vi.fn(),
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetch-http-client — 429-then-success retry flow', () => {
  it('retries on 429 and succeeds on the second attempt', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }, 200));

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok' });
  });

  it('retries on 429 twice then succeeds on the third attempt', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429))
      .mockResolvedValueOnce(jsonResponse({ message: 'still rate limited' }, 429))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }, 200));

    const client = createFetchHttpClient({
      ...createConfig(),
      fetch: fetchSpy,
      retry: {
        retries: 2,
        retryDelayMs: 0,
        retryableStatusCodes: [429],
      },
    } as any);

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ status: 'ok' });
  });

  it('exhausts retries on repeated 429 and throws', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse({ message: 'rate limited' }, 429)));
    const client = createFetchHttpClient(createConfig({
      fetch: fetchSpy,
      retry: {
        retries: 2,
        retryDelayMs: 0,
        retryableStatusCodes: [429],
      },
    }));

    await expect(
      client.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toThrow();

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('retries on 503 then succeeds', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse({ status: 'ok' }, 200));

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it('retries on 500 then succeeds with data passthrough', async () => {
    const mockData = { id: 'w-1', status: 'active', balance: '100' };
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'error' }, 500))
      .mockResolvedValueOnce(jsonResponse(mockData, 200));

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/wallets/w-1',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(response.data).toEqual(mockData);
  });
});
