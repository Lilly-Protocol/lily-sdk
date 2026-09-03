import { describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createConfig(overrides: Record<string, unknown> = {}) {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 2,
      retryDelayMs: 0,
      retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
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

describe('fetch-http-client — POST requests are never retried', () => {
  it('does not retry POST requests on 429', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse({ message: 'rate limited' }, 429)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await expect(
      client.request({
        method: 'POST',
        path: '/v1/payments',
        body: { amount: 100 },
      }),
    ).rejects.toThrow();

    // Should have been called exactly once — no retry for POST
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('does not retry POST requests on 500', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse({ message: 'server error' }, 500)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await expect(
      client.request({
        method: 'POST',
        path: '/v1/payments',
        body: { amount: 100 },
      }),
    ).rejects.toThrow();

    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('does not retry POST requests on 503', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse({ message: 'unavailable' }, 503)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await expect(
      client.request({
        method: 'POST',
        path: '/v1/wallets/provision',
        body: { agentId: 'a-1' },
      }),
    ).rejects.toThrow();

    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('does not retry POST requests on 502', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse({ message: 'bad gateway' }, 502)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await expect(
      client.request({
        method: 'POST',
        path: '/v1/payments/quote',
        body: { amount: 50 },
      }),
    ).rejects.toThrow();

    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('retries GET requests on 429 (for contrast)', async () => {
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

    // GET should be retried: 1 initial + 2 retries = 3 calls
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
