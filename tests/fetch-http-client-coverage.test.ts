import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyTransportError, LilyApiError } from '../src/errors/sdk-error';

describe('fetch-http-client coverage matrix', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    config = {
      baseUrl: new URL('https://api.example.com/v1'),
      fetch: mockFetch,
      timeoutMs: 5000,
      userAgent: 'test-agent',
      defaultHeaders: { 'x-custom': 'value' },
      retry: { retries: 2, retryDelayMs: 1, retryableStatusCodes: [429, 500] },
    } as unknown as ResolvedLilySdkConfig;
  });

  it('covers buildUrl with query params and path prefix', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
      text: async () => '',
    });

    const client = createFetchHttpClient(config);
    await client.request({
      method: 'GET',
      path: 'users',
      query: { id: 1, active: true, name: undefined },
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl.toString()).toBe('https://api.example.com/users?id=1&active=true');
    expect(calledInit).toEqual(expect.objectContaining({ method: 'GET' }));
  });

  it('covers serializeBody null branch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '',
    });

    const client = createFetchHttpClient(config);
    await client.request({ method: 'POST', path: '/test', body: null });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.body).toBeUndefined();
  });

  it('covers parseResponse non-JSON text branch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'plain text response',
    });

    const client = createFetchHttpClient(config);
    const res = await client.request({ method: 'GET', path: '/text' });

    expect(res.data).toBe('plain text response');
  });

  it('covers retry on 429 then success', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers(),
        json: async () => ({ error: 'rate limited' }),
        text: async () => '{"error":"rate limited"}',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
        text: async () => '{"ok":true}',
      });

    const client = createFetchHttpClient(config);
    const res = await client.request({ method: 'GET', path: '/retry' });

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('covers transport error retry path', async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError('network failure'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ recovered: true }),
        text: async () => '{"recovered":true}',
      });

    const client = createFetchHttpClient(config);
    const res = await client.request({ method: 'GET', path: '/transport-retry' });

    expect(res.data).toEqual({ recovered: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('covers shouldRetry returning false for POST', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({ error: 'server error' }),
      text: async () => '{"error":"server error"}',
    });

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'POST', path: '/no-retry-post' }),
    ).rejects.toThrow(LilyApiError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('covers isRetryableTransportError returning false for POST', async () => {
    mockFetch.mockRejectedValue(new TypeError('fail'));

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'POST', path: '/no-transport-retry-post' }),
    ).rejects.toThrow(LilyTransportError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('covers defaultHeaders merging', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '{}',
    });

    const client = createFetchHttpClient(config);
    await client.request({
      method: 'GET',
      path: '/headers',
      headers: { 'x-request': 'yes' },
    });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-custom']).toBe('value');
    expect(headers['x-request']).toBe('yes');
  });

  it('covers parseResponse 204 no content branch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: async () => ({}),
      text: async () => '',
    });

    const client = createFetchHttpClient(config);
    const res = await client.request({ method: 'DELETE', path: '/no-content' });

    expect(res.data).toBeNull();
  });
});
