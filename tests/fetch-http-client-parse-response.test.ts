import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config';
import type { HttpRequest } from '../src/http';

describe('fetch-http-client parseResponse', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns null data for 204 No Content responses', async () => {
    globalThis.fetch = vi.fn(() => {
      return Promise.resolve(new Response(null, {
        status: 204,
        headers: {},
      }));
    });

    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com', apiKey: 'test-key' });
    const client = createFetchHttpClient(config);
    const request: HttpRequest = { method: 'DELETE', path: '/v1/resource/1' };
    const response = await client.request(request);

    expect(response.status).toBe(204);
    expect(response.data).toBeNull();
  });

  it('returns raw string for text/plain responses', async () => {
    const body = 'plain text response body';
    globalThis.fetch = vi.fn(() => {
      return Promise.resolve(new Response(body, {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }));
    });

    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com', apiKey: 'test-key' });
    const client = createFetchHttpClient(config);
    const request: HttpRequest = { method: 'GET', path: '/v1/text-endpoint' };
    const response = await client.request(request);

    expect(response.status).toBe(200);
    expect(response.data).toBe(body);
  });

  it('parses application/json responses into objects', async () => {
    const body = { id: 'abc-123', status: 'active' };
    globalThis.fetch = vi.fn(() => {
      return Promise.resolve(new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    });

    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com', apiKey: 'test-key' });
    const client = createFetchHttpClient(config);
    const request: HttpRequest = { method: 'GET', path: '/v1/json-endpoint' };
    const response = await client.request(request);

    expect(response.status).toBe(200);
    expect(response.data).toEqual(body);
  });
});
