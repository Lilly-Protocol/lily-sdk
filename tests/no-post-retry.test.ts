import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function createMockConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: 'test-key',
    authToken: undefined,
    userAgent: 'lily-sdk/test',
    defaultHeaders: {},
    timeoutMs: 5000,
    retry: { retries: 3, retryDelayMs: 10, retryableStatusCodes: [429, 500, 502, 503, 504] },
    fetch: vi.fn(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

describe('fetch-http-client POST retry behavior', () => {
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    config = createMockConfig();
  });

  it('does NOT retry POST requests on retryable status codes', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Internal Server Error' }),
      text: vi.fn().mockResolvedValue('{"error":"Internal Server Error"}'),
    };
    vi.mocked(config.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'POST', path: '/v1/payments', body: { amount: '100' } }),
    ).rejects.toThrow();

    // POST should only be called once — no retries
    expect(config.fetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry PATCH requests on retryable status codes', async () => {
    const mockResponse = {
      ok: false,
      status: 503,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Service Unavailable' }),
      text: vi.fn().mockResolvedValue('{"error":"Service Unavailable"}'),
    };
    vi.mocked(config.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'PATCH', path: '/v1/agents/1', body: { name: 'updated' } }),
    ).rejects.toThrow();

    expect(config.fetch).toHaveBeenCalledTimes(1);
  });

  it('DOES retry GET requests on retryable status codes', async () => {
    const failResponse = {
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Internal Server Error' }),
      text: vi.fn().mockResolvedValue('{"error":"Internal Server Error"}'),
    };
    const successResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ status: 'ok' }),
      text: vi.fn().mockResolvedValue('{"status":"ok"}'),
    };

    vi.mocked(config.fetch)
      .mockResolvedValueOnce(failResponse as unknown as Response)
      .mockResolvedValueOnce(successResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'GET', path: '/v1/status' });

    expect(result.status).toBe(200);
    expect(config.fetch).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry POST on network transport errors', async () => {
    vi.mocked(config.fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'POST', path: '/v1/payments', body: { amount: '100' } }),
    ).rejects.toThrow();

    expect(config.fetch).toHaveBeenCalledTimes(1);
  });
});
