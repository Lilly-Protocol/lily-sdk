import { describe, expect, it, vi } from 'vitest';

import {
  LilyAuthenticationError,
  LilyValidationError,
} from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  it('rejects identity resolution without a usable resolver key before dispatch', () => {
    const requestSpy = vi.fn();
    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    expect(() => sdk.identity.resolve({ agentId: '  ' })).toThrowError(
      expect.objectContaining({
        name: 'LilyValidationError',
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('At least one of'),
      }),
    );
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('rejects wallet provisioning with an empty agent id before dispatch', () => {
    const requestSpy = vi.fn();
    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    let thrown: unknown;
    try {
      sdk.wallets.provision({ agentId: '', network: 'stellar-testnet' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(LilyValidationError);
    expect(thrown).toEqual(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('dispatches valid identity and wallet requests unchanged', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({ status: 200, headers: new Headers(), data: {} }),
    );
    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.identity.resolve({ domain: 'agent.example' });
    await sdk.wallets.provision({
      agentId: 'agent-1',
      network: 'stellar-testnet',
    });

    expect(requestSpy).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: '/v1/identity/resolve',
      body: { domain: 'agent.example' },
    });
    expect(requestSpy).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: '/v1/wallets/provision',
      body: { agentId: 'agent-1', network: 'stellar-testnet' },
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
