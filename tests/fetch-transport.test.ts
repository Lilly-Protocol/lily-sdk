import { describe, expect, it, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function makeConfig(fetchImpl: typeof fetch): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: undefined,
    authToken: undefined,
    userAgent: 'lily-sdk/test',
    defaultHeaders: {},
    timeoutMs: 5000,
    retry: { retries: 0, retryDelayMs: 0 },
    fetch: fetchImpl,
  } as unknown as ResolvedLilySdkConfig;
}

describe('fetch transport response handling', () => {
  it('returns null for 204 No Content responses', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const client = createFetchHttpClient(makeConfig(mockFetch));

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(204);
    expect(result.data).toBeNull();
  });

  it('returns raw string for text/plain responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('plain text body', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    );
    const client = createFetchHttpClient(makeConfig(mockFetch));

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(200);
    expect(result.data).toBe('plain text body');
  });

  it('parses application/json responses to objects', async () => {
    const payload = { ok: true, value: 42 };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createFetchHttpClient(makeConfig(mockFetch));

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(payload);
  });
});
