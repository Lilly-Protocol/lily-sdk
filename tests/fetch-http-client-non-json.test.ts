import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createConfig(
  overrides: Record<string, unknown> = {},
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: vi.fn<typeof globalThis.fetch>(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain' },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetch-http-client — non-JSON and 204 handling', () => {
  it('returns null for 204 No Content responses', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(emptyResponse(204)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(204);
    expect(response.data).toBeNull();
  });

  it('returns text body for non-JSON content-type', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(textResponse('plain text', 200)),
    );
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('plain text');
  });

  it('returns text body for HTML content-type', async () => {
    const htmlResponse = new Response('<html><body>Hello</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    const fetchSpy = vi.fn(() => Promise.resolve(htmlResponse));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('<html><body>Hello</body></html>');
  });

  it('returns text body when content-type is missing', async () => {
    const noTypeResponse = new Response('no type', {
      status: 200,
      headers: {},
    });
    const fetchSpy = vi.fn(() => Promise.resolve(noTypeResponse));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(typeof response.data).toBe('string');
  });
});
