import { describe, expect, it, vi } from 'vitest';

import { LilyApiError, LilyAuthenticationError } from '../src/errors/sdk-error';
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

  it.each([401, 403])(
    'maps a %i authentication failure with its payload to a typed error',
    async (statusCode) => {
      const details = { message: 'nope' };
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
            new Response(JSON.stringify(details), {
              status: statusCode,
              headers: {
                'content-type': 'application/json',
              },
            }),
          ),
        ),
      });

      const error = await httpClient
        .request({
          method: 'GET',
          path: '/v1/system/health',
        })
        .catch((requestError: unknown) => requestError);

      expect(error).toBeInstanceOf(LilyAuthenticationError);
      expect(error).toMatchObject({
        statusCode,
        code: 'AUTHENTICATION_ERROR',
        details,
      });
    },
  );

  it('maps a non-retryable API failure with its payload to a typed error', async () => {
    const details = { message: 'internal failure', requestId: 'request-123' };
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
          new Response(JSON.stringify(details), {
            status: 500,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    });

    const error = await httpClient
      .request({
        method: 'GET',
        path: '/v1/system/health',
      })
      .catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(LilyApiError);
    expect(error).toMatchObject({
      statusCode: 500,
      code: 'API_ERROR',
      details,
    });
  });
});
