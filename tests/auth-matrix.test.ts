import { describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('auth header matrix', () => {
  const baseConfig = {
    baseUrl: 'https://api.lily.test',
    timeoutMs: 2_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
  };

  it('sends only x-api-key when only apiKey is configured', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    const config = resolveLilySdkConfig({ ...baseConfig, apiKey: 'test-key', fetch: fetchSpy });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/test' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as [RequestInfo | URL, RequestInit | undefined][];
    const init = calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get('x-api-key')).toBe('test-key');
    expect(headers.has('authorization')).toBe(false);
  });

  it('sends only authorization bearer when only authToken is configured', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    const config = resolveLilySdkConfig({ ...baseConfig, authToken: 'test-token', fetch: fetchSpy });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/test' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as [RequestInfo | URL, RequestInit | undefined][];
    const init = calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.has('x-api-key')).toBe(false);
  });

  it('sends both headers when both credentials are configured', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    const config = resolveLilySdkConfig({ ...baseConfig, apiKey: 'test-key', authToken: 'test-token', fetch: fetchSpy });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/test' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as [RequestInfo | URL, RequestInit | undefined][];
    const init = calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get('x-api-key')).toBe('test-key');
    expect(headers.get('authorization')).toBe('Bearer test-token');
  });

  it('sends neither auth header when no credentials are configured', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    const config = resolveLilySdkConfig({ ...baseConfig, fetch: fetchSpy });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/test' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as [RequestInfo | URL, RequestInit | undefined][];
    const init = calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.has('x-api-key')).toBe(false);
    expect(headers.has('authorization')).toBe(false);
  });
});
