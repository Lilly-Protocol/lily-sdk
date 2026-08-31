import { describe, expect, it, vi } from 'vitest';
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
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    ...overrides,
  } as ResolvedLilySdkConfig;
}

describe('fetch-http-client parseResponse', () => {
  it('returns null data for 204 responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const config = makeConfig({ fetch: fetchMock });
    const client = createFetchHttpClient(config);

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(204);
    expect(result.data).toBeNull();
  });

  it('returns raw string for text/plain responses', async () => {
    const body = 'plain text response';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } }),
    );
    const config = makeConfig({ fetch: fetchMock });
    const client = createFetchHttpClient(config);

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(200);
    expect(result.data).toBe(body);
  });

  it('parses application/json responses to objects', async () => {
    const data = { key: 'value', nested: { ok: true } };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const config = makeConfig({ fetch: fetchMock });
    const client = createFetchHttpClient(config);

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(data);
  });
});
