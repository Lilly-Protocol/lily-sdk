import { describe, expect, it, vi } from 'vitest';

import {
  LilyApiError,
  LilyAuthenticationError,
} from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  it('calls system health endpoint through the system client', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          status: 'ok',
          version: '0.1.0',
          timestamp: new Date().toISOString(),
          checks: {
            api: 'ok',
          },
        },
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(requestSpy),
    );

    const health = await sdk.system.health();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/system/health',
    });
    expect(health.status).toBe('ok');
  });

  it('adds auth headers to transport requests', async () => {
    const fetchSpy = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        authorization: 'Bearer secret-token',
        'x-api-key': 'secret-key',
      });

      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'ok',
            version: '0.1.0',
            timestamp: new Date().toISOString(),
            checks: {
              api: 'ok',
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      apiKey: 'secret-key',
      authToken: 'secret-token',
      timeoutMs: 2_000,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const response = await httpClient.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('maps authentication failures to a typed error', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'nope' }), {
            status: 401,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    });

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toBeInstanceOf(LilyAuthenticationError);
  });

  it('does not retry POST requests on retryable statuses', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'fail' }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
          },
        }),
      ),
    );

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 3,
        retryDelayMs: 0,
        retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    try {
      await httpClient.request({
        method: 'POST',
        path: '/v1/payments',
      });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LilyApiError);
      const apiError = error as LilyApiError;
      expect(apiError.statusCode).toBe(500);
    }

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries GET requests on retryable statuses', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'fail' }), {
          status: 500,
          headers: {
            'content-type': 'application/json',
          },
        }),
      ),
    );

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 2,
        retryDelayMs: 0,
        retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    try {
      await httpClient.request({
        method: 'GET',
        path: '/v1/items',
      });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LilyApiError);
      const apiError = error as LilyApiError;
      expect(apiError.statusCode).toBe(500);
    }

    // Initial attempt + 2 retries = 3 total calls
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
