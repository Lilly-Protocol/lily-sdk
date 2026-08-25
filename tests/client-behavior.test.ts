import { describe, expect, it, vi } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
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

  describe('baseUrl path prefixes', () => {
    async function requestedHref(
      baseUrl: string,
      path: string,
      query?: Record<string, string | number | boolean | undefined>,
    ): Promise<string> {
      const fetchSpy = vi.fn((_input: URL | RequestInfo) =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      );

      const httpClient = createFetchHttpClient(
        resolveLilySdkConfig({
          baseUrl,
          fetch: fetchSpy,
        }),
      );

      await httpClient.request({
        method: 'GET',
        path,
        ...(query === undefined ? {} : { query }),
      });

      expect(fetchSpy).toHaveBeenCalledOnce();
      return String(fetchSpy.mock.calls[0]?.[0]);
    }

    it('keeps a path prefix when baseUrl has no trailing slash', async () => {
      await expect(
        requestedHref('https://host/lily/api', '/v1/system/health'),
      ).resolves.toBe('https://host/lily/api/v1/system/health');
    });

    it('keeps a path prefix when baseUrl already has a trailing slash', async () => {
      await expect(
        requestedHref('https://host/lily/api/', '/v1/system/health'),
      ).resolves.toBe('https://host/lily/api/v1/system/health');
    });

    it('joins request paths onto a host-root baseUrl', async () => {
      await expect(
        requestedHref('https://api.lily.test', '/v1/system/health'),
      ).resolves.toBe('https://api.lily.test/v1/system/health');
    });

    it('appends query parameters onto a path-prefixed URL', async () => {
      await expect(
        requestedHref('https://host/lily/api', '/v1/agents', {
          limit: 10,
          status: 'active',
        }),
      ).resolves.toBe('https://host/lily/api/v1/agents?limit=10&status=active');
    });
  });
});
