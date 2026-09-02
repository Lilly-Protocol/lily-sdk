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

describe('fetch-http-client 429 then success retry flow', () => {
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    config = createMockConfig();
  });

  it('retries GET on 429 and returns success on subsequent attempt', async () => {
    const rateLimitedResponse = {
      ok: false,
      status: 429,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Too Many Requests' }),
      text: vi.fn().mockResolvedValue('{"error":"Too Many Requests"}'),
    };
    const successResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ data: 'ok' }),
      text: vi.fn().mockResolvedValue('{"data":"ok"}'),
    };

    vi.mocked(config.fetch)
      .mockResolvedValueOnce(rateLimitedResponse as unknown as Response)
      .mockResolvedValueOnce(successResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'GET', path: '/v1/resource' });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data: 'ok' });
    expect(config.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries PUT on 429 and returns success on subsequent attempt', async () => {
    const rateLimitedResponse = {
      ok: false,
      status: 429,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Rate Limited' }),
      text: vi.fn().mockResolvedValue('{"error":"Rate Limited"}'),
    };
    const successResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ updated: true }),
      text: vi.fn().mockResolvedValue('{"updated":true}'),
    };

    vi.mocked(config.fetch)
      .mockResolvedValueOnce(rateLimitedResponse as unknown as Response)
      .mockResolvedValueOnce(successResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'PUT', path: '/v1/resource/1', body: { name: 'test' } });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ updated: true });
    expect(config.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries on persistent 429', async () => {
    const rateLimitedResponse = {
      ok: false,
      status: 429,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ error: 'Too Many Requests' }),
      text: vi.fn().mockResolvedValue('{"error":"Too Many Requests"}'),
    };

    vi.mocked(config.fetch).mockResolvedValue(rateLimitedResponse as unknown as Response);

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'GET', path: '/v1/resource' }),
    ).rejects.toThrow();

    // Initial attempt + 3 retries = 4 total calls
    expect(config.fetch).toHaveBeenCalledTimes(4);
  });
});
