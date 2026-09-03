import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyTransportError } from '../src/errors/sdk-error';

function createConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: 'test-key',
    authToken: undefined,
    timeoutMs: 100,
    retry: { retries: 2, retryDelayMs: 1, retryableStatusCodes: [408, 429, 500, 502, 503, 504] },
    userAgent: 'test-agent',
    defaultHeaders: {},
    fetch: vi.fn(),
    ...overrides,
  } as ResolvedLilySdkConfig;
}

describe('Retry timed-out requests', () => {
  it('retries GET requests that time out when retry budget remains', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const mockFetch = vi.fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));

    const config = createConfig({ fetch: mockFetch });
    const client = createFetchHttpClient(config);

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ ok: true });
  });

  it('throws TIMEOUT after exhausting retries on GET', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const mockFetch = vi.fn().mockRejectedValue(abortError);
    const config = createConfig({ fetch: mockFetch, retry: { retries: 1, retryDelayMs: 1, retryableStatusCodes: [] } });
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'GET', path: '/test' }))
      .rejects.toThrow(LilyTransportError);

    await expect(client.request({ method: 'GET', path: '/test' }))
      .rejects.toMatchObject({ code: 'TIMEOUT' });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('does not retry POST requests that time out', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const mockFetch = vi.fn().mockRejectedValue(abortError);
    const config = createConfig({ fetch: mockFetch, retry: { retries: 3, retryDelayMs: 1, retryableStatusCodes: [] } });
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'POST', path: '/test', body: { x: 1 } }))
      .rejects.toMatchObject({ code: 'TIMEOUT' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
