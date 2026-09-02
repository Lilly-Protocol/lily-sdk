import { describe, expect, it, vi } from 'vitest';

import {
  BaseClient,
  LilyAuthenticationError,
  LilySdk,
  createFetchHttpClient,
} from '../src/index';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  it('exposes transport primitives from the root entrypoint', () => {
    expect(createFetchHttpClient).toBeInstanceOf(Function);
    expect(BaseClient).toBeInstanceOf(Function);
  });

  it('allows subclassing BaseClient with a custom HTTP client', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: { ok: true },
      }),
    );

    class TestClient extends BaseClient {
      async probe() {
        return this.request<{ ok: boolean }>({ method: 'GET', path: '/probe' });
      }
    }

    const client = new TestClient(createMockHttpClient(requestSpy));
    const result = await client.probe();

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', path: '/probe' });
    expect(result.ok).toBe(true);
  });

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

  it('maps authentication failures to a typed error with full payload', async () => {
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
          new Response(JSON.stringify({ message: 'nope', code: 'INVALID_TOKEN' }), {
            status: 401,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    });

    try {
      await httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LilyAuthenticationError);
      const authError = error as LilyAuthenticationError;
      expect(authError.request).toEqual({
        method: 'GET',
        path: '/v1/system/health',
        url: 'https://api.lily.test/v1/system/health',
      });
    }
  });

  it('attaches request metadata to api errors', async () => {
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
          new Response(JSON.stringify({ message: 'fail' }), {
            status: 500,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
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
      expect(apiError.request).toEqual({
        method: 'GET',
        path: '/v1/items',
        url: 'https://api.lily.test/v1/items',
      });
    }
  });

  it('attaches request metadata to transport timeout errors', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 10,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: vi.fn((...args: unknown[]) => {
        const init = args[1] as RequestInit | undefined;
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        });
      }),
    ).rejects.toThrow(LilyAuthenticationError);

    try {
      await httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LilyAuthenticationError);
      const authError = error as LilyAuthenticationError;
      expect(authError.statusCode).toBe(401);
      expect(authError.code).toBe('AUTHENTICATION_ERROR');
      expect(authError.details).toEqual({ message: 'nope' });
    }
  });

  it('propagates full error payload on non-retryable API errors', async () => {
    const errorBody = {
      code: 'INVALID_REQUEST',
      message: 'Missing required field',
      field: 'amount',
    };

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
          new Response(JSON.stringify(errorBody), {
            status: 400,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    });

    try {
      await httpClient.request({
        method: 'POST',
        path: '/v1/payments',
        body: {},
      });
      expect.fail('Expected LilyApiError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LilyApiError);
      const apiError = error as LilyApiError;
      expect(apiError.statusCode).toBe(400);
      expect(apiError.code).toBe('API_ERROR');
      expect(apiError.details).toEqual(errorBody);
    }
  });

  describe.each([
    {
      scenario: 'apiKey only',
      config: { apiKey: 'my-api-key' },
      expectedHeaders: { 'x-api-key': 'my-api-key' },
      disallowedHeaders: ['authorization'],
    },
    {
      scenario: 'authToken only',
      config: { authToken: 'my-token' },
      expectedHeaders: { authorization: 'Bearer my-token' },
      disallowedHeaders: ['x-api-key'],
    },
    {
      scenario: 'both apiKey and authToken',
      config: { apiKey: 'my-api-key', authToken: 'my-token' },
      expectedHeaders: {
        authorization: 'Bearer my-token',
        'x-api-key': 'my-api-key',
      },
      disallowedHeaders: [],
    },
    {
      scenario: 'neither credential',
      config: {},
      expectedHeaders: {},
      disallowedHeaders: ['authorization', 'x-api-key'],
    },
  ])('auth credential forwarding ($scenario)', ({ config, expectedHeaders, disallowedHeaders }) => {
    it(`forwards the expected authentication headers for ${config}`, async () => {
      const fetchSpy = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;

        for (const [key, value] of Object.entries(expectedHeaders)) {
          expect(headers[key]).toBe(value);
        }

        for (const key of disallowedHeaders) {
          expect(headers[key]).toBeUndefined();
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({ status: 'ok' }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          ),
        );
      });

      const httpClient = createFetchHttpClient({
        baseUrl: new URL('https://api.lily.test/'),
        ...config,
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
  });

  it('merges defaultHeaders with per-request headers', async () => {
    const fetchSpy = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'lily-sdk/test',
        'x-tenant': 'acme',
        'x-request-id': 'req-123',
      });

      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }),
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {
        'x-tenant': 'acme',
      },
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    await httpClient.request({
      method: 'GET',
      path: '/v1/items',
      headers: {
        'x-request-id': 'req-123',
      },
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('allows per-request headers to override defaultHeaders', async () => {
    const fetchSpy = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        'x-tenant': 'override',
      });

      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }),
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {
        'x-tenant': 'acme',
      },
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    await httpClient.request({
      method: 'GET',
      path: '/v1/items',
      headers: {
        'x-tenant': 'override',
      },
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
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

