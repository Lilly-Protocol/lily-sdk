import { describe, expect, it, vi } from 'vitest';

import { LilyAuthenticationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  it.each([
    [
      'agent',
      (sdk: LilySdk) => sdk.agents.get('agent/with?special #id'),
      '/v1/agents/agent%2Fwith%3Fspecial%20%23id',
    ],
    [
      'wallet',
      (sdk: LilySdk) => sdk.wallets.get('wallet/with?special #id'),
      '/v1/wallets/wallet%2Fwith%3Fspecial%20%23id',
    ],
    [
      'payment',
      (sdk: LilySdk) => sdk.payments.get('payment/with?special #id'),
      '/v1/payments/payment%2Fwith%3Fspecial%20%23id',
    ],
  ])(
    'URL-encodes special characters in %s ids',
    async (_client, getResource, expectedPath) => {
      const requestSpy = vi.fn(() =>
        Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: {},
        }),
      );
      const sdk = new LilySdk(
        {
          baseUrl: 'https://api.lily.test',
          fetch: globalThis.fetch,
        },
        createMockHttpClient(requestSpy),
      );

      await getResource(sdk);

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'GET',
        path: expectedPath,
      });
    },
  );

  it('URL-encodes special characters when updating an agent', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {},
      }),
    );
    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(requestSpy),
    );
    const input = { name: 'Updated agent' };

    await sdk.agents.update('agent/with?special #id', input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/v1/agents/agent%2Fwith%3Fspecial%20%23id',
      body: input,
    });
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
