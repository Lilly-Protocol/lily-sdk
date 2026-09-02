import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('auth header matrix', () => {
  function captureHeaders(configOverrides: Record<string, unknown>) {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch as typeof fetch,
      ...configOverrides,
    });

    const client = createFetchHttpClient(config);
    return { client, mockFetch };
  }

  it('sends x-api-key when only apiKey is configured', async () => {
    const { client, mockFetch } = captureHeaders({ apiKey: 'test-key' });
    await client.request({ method: 'GET', path: '/test' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    if (!call) throw new Error('fetch not called');
    const init = call[1] as RequestInit | undefined;
    const headers = new Headers(init?.headers);
    expect(headers.get('x-api-key')).toBe('test-key');
    expect(headers.get('authorization')).toBeNull();
  });

  it('sends Bearer token when only authToken is configured', async () => {
    const { client, mockFetch } = captureHeaders({ authToken: 'test-token' });
    await client.request({ method: 'GET', path: '/test' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    if (!call) throw new Error('fetch not called');
    const init = call[1] as RequestInit | undefined;
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-api-key')).toBeNull();
  });

  it('sends both headers when apiKey and authToken are configured', async () => {
    const { client, mockFetch } = captureHeaders({
      apiKey: 'test-key',
      authToken: 'test-token',
    });
    await client.request({ method: 'GET', path: '/test' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    if (!call) throw new Error('fetch not called');
    const init = call[1] as RequestInit | undefined;
    const headers = new Headers(init?.headers);
    expect(headers.get('x-api-key')).toBe('test-key');
    expect(headers.get('authorization')).toBe('Bearer test-token');
  });

  it('sends neither auth header when no credentials are configured', async () => {
    const { client, mockFetch } = captureHeaders({});
    await client.request({ method: 'GET', path: '/test' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    if (!call) throw new Error('fetch not called');
    const init = call[1] as RequestInit | undefined;
    const headers = new Headers(init?.headers);
    expect(headers.get('x-api-key')).toBeNull();
    expect(headers.get('authorization')).toBeNull();
  });
});
