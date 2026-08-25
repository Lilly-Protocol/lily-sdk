import { describe, expect, it, vi } from 'vitest';

import { LilyAuthenticationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { HttpRequest } from '../src/http/types';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  it('routes client operations to their API endpoints', async () => {
    const requestSpy = vi.fn((_request: HttpRequest) =>
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
    const agentInput = {
      name: 'Test agent',
      network: 'stellar-testnet' as const,
    };
    const paymentInput = {
      fromWalletId: 'wallet-1',
      toAddress: 'GDESTINATION',
      amount: { assetCode: 'USDC', amount: '10' },
    };

    await sdk.agents.list();
    await sdk.agents.list({ limit: 10, status: 'active' });
    await sdk.agents.get('agent-1');
    await sdk.agents.create(agentInput);
    await sdk.agents.update('agent-1', { name: 'Updated agent' });
    await sdk.wallets.provision({
      agentId: 'agent-1',
      network: 'stellar-testnet',
    });
    await sdk.wallets.get('wallet-1');
    await sdk.payments.quote(paymentInput);
    await sdk.payments.execute(paymentInput);
    await sdk.payments.get('payment-1');
    await sdk.identity.resolve({ agentId: 'agent-1' });
    await sdk.identity.verify({
      identityId: 'identity-1',
      challenge: 'challenge',
      signature: 'signature',
    });
    await sdk.system.info();

    expect(requestSpy.mock.calls.map(([request]) => request)).toEqual([
      { method: 'GET', path: '/v1/agents', query: {} },
      {
        method: 'GET',
        path: '/v1/agents',
        query: { limit: 10, status: 'active' },
      },
      { method: 'GET', path: '/v1/agents/agent-1' },
      { method: 'POST', path: '/v1/agents', body: agentInput },
      {
        method: 'PATCH',
        path: '/v1/agents/agent-1',
        body: { name: 'Updated agent' },
      },
      {
        method: 'POST',
        path: '/v1/wallets/provision',
        body: { agentId: 'agent-1', network: 'stellar-testnet' },
      },
      { method: 'GET', path: '/v1/wallets/wallet-1' },
      { method: 'POST', path: '/v1/payments/quote', body: paymentInput },
      { method: 'POST', path: '/v1/payments', body: paymentInput },
      { method: 'GET', path: '/v1/payments/payment-1' },
      {
        method: 'POST',
        path: '/v1/identity/resolve',
        body: { agentId: 'agent-1' },
      },
      {
        method: 'POST',
        path: '/v1/identity/verify',
        body: {
          identityId: 'identity-1',
          challenge: 'challenge',
          signature: 'signature',
        },
      },
      { method: 'GET', path: '/v1/system/info' },
    ]);
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
