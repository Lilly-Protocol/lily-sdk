import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyTransportError, LilyApiError } from '../src/errors/sdk-error';
import type { LilySdkConfig } from '../src/config/types';

describe('Retry-After header honored on 429', () => {
  it('retries after the delay specified in Retry-After header', async () => {
    const sleepSpy = vi.fn().mockResolvedValue(undefined);
    let callCount = 0;
    const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response('{"error":"rate limited"}', {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '1' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      fetch: mockFetch as any,
    };
    const resolved = resolveLilySdkConfig(config);
    const client = createFetchHttpClient(resolved);

    const response = await client.request({ method: 'GET', path: '/v1/test' });
    expect(response.status).toBe(200);
    expect(callCount).toBe(2);
  });

  it('does not retry POST on 429', async () => {
    let callCount = 0;
    const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
      callCount++;
      return new Response('{"error":"rate limited"}', {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '1' },
      });
    });

    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      fetch: mockFetch as any,
    };
    const resolved = resolveLilySdkConfig(config);
    const client = createFetchHttpClient(resolved);

    await expect(
      client.request({ method: 'POST', path: '/v1/test', body: { data: 1 } }),
    ).rejects.toThrow();

    expect(callCount).toBe(1);
  });

  it('retries on 503 with Retry-After', async () => {
    let callCount = 0;
    const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response('{"error":"unavailable"}', {
          status: 503,
          headers: { 'content-type': 'application/json', 'retry-after': '0' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      fetch: mockFetch as any,
    };
    const resolved = resolveLilySdkConfig(config);
    const client = createFetchHttpClient(resolved);

    const response = await client.request({ method: 'GET', path: '/v1/test' });
    expect(response.status).toBe(200);
    expect(callCount).toBe(2);
  });

  it('throws LilyApiError after exhausting retries', async () => {
    const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
      return new Response('{"error":"rate limited"}', {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '0' },
      });
    });

    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      fetch: mockFetch as any,
      retry: { retries: 2, retryDelayMs: 0 },
    };
    const resolved = resolveLilySdkConfig(config);
    const client = createFetchHttpClient(resolved);

    await expect(
      client.request({ method: 'GET', path: '/v1/test' }),
    ).rejects.toThrow(LilyApiError);

    // Initial + 2 retries = 3 total
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
