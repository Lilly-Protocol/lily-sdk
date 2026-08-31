import { describe, expect, it, vi } from 'vitest';

import { LilyAuthenticationError } from '../src/errors/sdk-error';
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
});

describe('error payload propagation', () => {
  it('propagates statusCode, code, and details for 401 LilyAuthenticationError', async () => {
    const errorBody = { message: 'invalid token', hint: 'check expiry' };
    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorBody), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    });

    try {
      await httpClient.request({ method: 'GET', path: '/v1/system/health' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const authErr = err as InstanceType<typeof LilyAuthenticationError>;
      expect(authErr.statusCode).toBe(401);
      expect(authErr.code).toBe('AUTHENTICATION_ERROR');
      expect(authErr.details).toEqual(errorBody);
    }
  });

  it('propagates statusCode, code, and details for 500 LilyApiError', async () => {
    const { LilyApiError } = await import('../src/errors/sdk-error');
    const errorBody = { error: 'internal failure', traceId: 'abc-123' };
    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(errorBody), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    });

    try {
      await httpClient.request({ method: 'GET', path: '/v1/system/health' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const apiErr = err as InstanceType<typeof LilyApiError>;
      expect(apiErr.statusCode).toBe(500);
      expect(apiErr.code).toBe('API_ERROR');
      expect(apiErr.details).toEqual(errorBody);
    }
  });
});
