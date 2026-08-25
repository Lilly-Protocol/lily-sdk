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

  it.each([
    {
      name: 'api key only',
      credentials: { apiKey: 'secret-key' },
      authHeaders: { 'x-api-key': 'secret-key' },
    },
    {
      name: 'auth token only',
      credentials: { authToken: 'secret-token' },
      authHeaders: { authorization: 'Bearer secret-token' },
    },
    {
      name: 'both credentials',
      credentials: { apiKey: 'secret-key', authToken: 'secret-token' },
      authHeaders: {
        'x-api-key': 'secret-key',
        authorization: 'Bearer secret-token',
      },
    },
    {
      name: 'no credentials',
      credentials: {},
      authHeaders: {},
    },
  ])(
    'forwards the correct auth headers with $name',
    async ({ credentials, authHeaders }) => {
      const fetchSpy = vi.fn((input: URL | RequestInfo, init?: RequestInit) => {
        expect(input).toEqual(
          new URL('https://api.lily.test/v1/system/health'),
        );
        expect(init?.method).toBe('GET');

        return Promise.resolve(
          new Response(null, {
            status: 200,
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
        defaultHeaders: {},
        userAgent: 'lily-sdk/test',
        fetch: fetchSpy,
        ...credentials,
      });

      await httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      });

      expect(fetchSpy).toHaveBeenCalledOnce();
      expect(fetchSpy.mock.calls[0]?.[1]?.headers).toEqual({
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'lily-sdk/test',
        ...authHeaders,
      });
    },
  );

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
