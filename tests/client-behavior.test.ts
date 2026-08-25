import { describe, expect, it, vi } from 'vitest';

import {
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
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

    const failure = expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
        query: { verbose: true },
      }),
    ).rejects;

    await failure.toBeInstanceOf(LilyAuthenticationError);
    await failure.toMatchObject({
      request: {
        method: 'GET',
        path: '/v1/system/health',
        url: 'https://api.lily.test/v1/system/health?verbose=true',
      },
    });
  });

  it('attaches request metadata to API failures', async () => {
    const httpClient = createTestHttpClient(() =>
      Promise.resolve(new Response('unavailable', { status: 503 })),
    );

    await expect(
      httpClient.request({ method: 'POST', path: '/v1/payments' }),
    ).rejects.toMatchObject({
      name: LilyApiError.name,
      request: {
        method: 'POST',
        path: '/v1/payments',
        url: 'https://api.lily.test/v1/payments',
      },
    });
  });

  it('attaches request metadata to timeout failures', async () => {
    const httpClient = createTestHttpClient((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
      1,
    );

    await expect(
      httpClient.request({ method: 'GET', path: '/v1/wallets' }),
    ).rejects.toMatchObject({
      name: LilyTransportError.name,
      code: 'TIMEOUT',
      request: {
        method: 'GET',
        path: '/v1/wallets',
        url: 'https://api.lily.test/v1/wallets',
      },
    });
  });

  it('attaches request metadata to network failures', async () => {
    const httpClient = createTestHttpClient(() => Promise.reject(new Error('offline')));

    await expect(
      httpClient.request({ method: 'POST', path: '/v1/payments' }),
    ).rejects.toMatchObject({
      name: LilyTransportError.name,
      code: 'TRANSPORT_ERROR',
      request: {
        method: 'POST',
        path: '/v1/payments',
        url: 'https://api.lily.test/v1/payments',
      },
    });
  });
});

function createTestHttpClient(
  fetch: typeof globalThis.fetch,
  timeoutMs = 2_000,
) {
  return createFetchHttpClient({
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs,
    retry: {
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch,
  });
}
