import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilyApiError } from '../src/errors/sdk-error';
import type { ResolvedLilySdkConfig } from '../src/config/types';

describe('fetch-http-client retry exhaustion', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    config = {
      baseUrl: new URL('https://api.example.com'),
      userAgent: 'test-agent',
      timeoutMs: 5000,
      fetch: mockFetch as typeof globalThis.fetch,
      defaultHeaders: {},
      retry: {
        retries: 2,
        retryDelayMs: 1,
        retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws LilyApiError after exhausting retries with correct status code', async () => {
    mockFetch.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ error: 'Service Unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    })));

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'GET', path: '/test' }),
    ).rejects.toThrow(LilyApiError);

    expect(mockFetch).toHaveBeenCalledTimes(3);

    try {
      await client.request({ method: 'GET', path: '/test' });
    } catch (error) {
      expect(error).toBeInstanceOf(LilyApiError);
      expect((error as LilyApiError).statusCode).toBe(503);
    }
  });
});
