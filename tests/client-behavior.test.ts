import { describe, expect, it, vi } from 'vitest';

import { LilyAuthenticationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  const authMatrix: {
    name: string;
    config: Record<string, string>;
    expected: Record<string, string>;
    absent: string[];
  }[] = [
    {
      name: 'apiKey only',
      config: { apiKey: 'secret-key' },
      expected: { 'x-api-key': 'secret-key' },
      absent: ['authorization'],
    },
    {
      name: 'authToken only',
      config: { authToken: 'secret-token' },
      expected: { authorization: 'Bearer secret-token' },
      absent: ['x-api-key'],
    },
    {
      name: 'both credentials',
      config: { apiKey: 'secret-key', authToken: 'secret-token' },
      expected: {
        authorization: 'Bearer secret-token',
        'x-api-key': 'secret-key',
      },
      absent: [],
    },
    {
      name: 'no credentials',
      config: {},
      expected: {},
      absent: ['authorization', 'x-api-key'],
    },
  ];

  for (const testCase of authMatrix) {
    it(`sends correct auth headers for ${testCase.name} configuration`, async () => {
      const fetchSpy = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              status: 'ok',
              version: '0.1.0',
              timestamp: new Date().toISOString(),
              checks: { api: 'ok' },
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            },
          ),
        ),
      );

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
        fetch: fetchSpy,
        ...testCase.config,
      });

      await httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const calls = fetchSpy.mock.calls as unknown as [unknown, RequestInit | undefined][];
      const init = calls[0]?.[1];
      const headers = (init?.headers ?? {}) as Record<string, string>;

      expect(headers).toMatchObject(testCase.expected);
      for (const key of testCase.absent) {
        expect(headers[key]).toBeUndefined();
      }
    });
  }

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
