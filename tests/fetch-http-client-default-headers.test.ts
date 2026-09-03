import { describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createConfig(overrides: Record<string, unknown> = {}) {
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

describe('fetch-http-client — defaultHeaders merging', () => {
  it('merges defaultHeaders into the request headers', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({
      defaultHeaders: { 'X-Custom-Header': 'custom-value', 'X-Trace-Id': 'abc123' },
      fetch: fetchSpy,
    }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['X-Custom-Header']).toBe('custom-value');
    expect(headers['X-Trace-Id']).toBe('abc123');
  });

  it('includes standard default headers (accept, content-type, user-agent)', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({
      userAgent: 'my-agent/1.0',
      fetch: fetchSpy,
    }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['accept']).toBe('application/json');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['user-agent']).toBe('my-agent/1.0');
  });

  it('adds x-api-key when apiKey is set', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({
      apiKey: 'my-api-key',
      fetch: fetchSpy,
    }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('my-api-key');
  });

  it('adds authorization Bearer when authToken is set', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({
      authToken: 'my-token',
      fetch: fetchSpy,
    }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['authorization']).toBe('Bearer my-token');
  });

  it('per-request headers override defaultHeaders', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({
      defaultHeaders: { 'X-Override-Me': 'default' },
      fetch: fetchSpy,
    }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
      headers: { 'X-Override-Me': 'overridden' },
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['X-Override-Me']).toBe('overridden');
  });

  it('per-request headers are merged with defaults without losing defaults', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({
      defaultHeaders: { 'X-Default': 'keep' },
      fetch: fetchSpy,
    }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
      headers: { 'X-Request-Only': 'added' },
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['X-Default']).toBe('keep');
    expect(headers['X-Request-Only']).toBe('added');
  });

  it('does not add x-api-key when apiKey is not set', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['x-api-key']).toBeUndefined();
  });

  it('does not add authorization when authToken is not set', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchSpy = (_input: URL | RequestInfo, init?: RequestInit) => {
      capturedInit = init;
      return Promise.resolve(jsonResponse({}));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    const headers = capturedInit!.headers as Record<string, string>;
    expect(headers['authorization']).toBeUndefined();
  });
});
