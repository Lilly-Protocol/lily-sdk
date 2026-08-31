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
});

