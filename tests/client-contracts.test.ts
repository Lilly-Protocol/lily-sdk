import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import type {
  AgentClientContract,
  IdentityClientContract,
  PaymentClientContract,
  SystemClientContract,
  WalletClientContract,
} from '../src/types/contracts';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client contracts', () => {
  const requestSpy = vi.fn(() =>
    Promise.resolve({
      status: 200,
      headers: new Headers(),
      data: undefined,
    }),
  );
  const sdk = new LilySdk(
    { baseUrl: 'https://api.lily.test' },
    createMockHttpClient(requestSpy),
  );

  beforeEach(() => {
    requestSpy.mockClear();
  });

  it('pins the agents client to AgentClientContract', async () => {
    const client: AgentClientContract = sdk.agents;
    const createInput = {
      name: 'Treasury agent',
      network: 'stellar-testnet' as const,
      capabilities: ['payments'],
    };
    const updateInput = { name: 'Updated treasury agent' };

    await client.list({ limit: 10, status: 'active' });
    await client.get('agent-123');
    await client.create(createInput);
    await client.update('agent-123', updateInput);

    expect(requestSpy.mock.calls).toEqual([
      [
        {
          method: 'GET',
          path: '/v1/agents',
          query: { limit: 10, status: 'active' },
        },
      ],
      [{ method: 'GET', path: '/v1/agents/agent-123' }],
      [{ method: 'POST', path: '/v1/agents', body: createInput }],
      [
        {
          method: 'PATCH',
          path: '/v1/agents/agent-123',
          body: updateInput,
        },
      ],
    ]);
  });

  it('pins the wallets client to WalletClientContract', async () => {
    const client: WalletClientContract = sdk.wallets;
    const provisionInput = {
      agentId: 'agent-123',
      network: 'stellar-testnet' as const,
      fundingAsset: { assetCode: 'USDC', amount: '25.00' },
    };

    await client.provision(provisionInput);
    await client.get('wallet-123');

    expect(requestSpy.mock.calls).toEqual([
      [
        {
          method: 'POST',
          path: '/v1/wallets/provision',
          body: provisionInput,
        },
      ],
      [{ method: 'GET', path: '/v1/wallets/wallet-123' }],
    ]);
  });

  it('pins the payments client to PaymentClientContract', async () => {
    const client: PaymentClientContract = sdk.payments;
    const quoteInput = {
      fromWalletId: 'wallet-123',
      toAddress: 'GDESTINATION',
      amount: { assetCode: 'USDC', amount: '10.00' },
    };
    const executeInput = {
      ...quoteInput,
      idempotencyKey: 'payment-request-123',
    };

    await client.quote(quoteInput);
    await client.execute(executeInput);
    await client.get('payment-123');

    expect(requestSpy.mock.calls).toEqual([
      [{ method: 'POST', path: '/v1/payments/quote', body: quoteInput }],
      [{ method: 'POST', path: '/v1/payments', body: executeInput }],
      [{ method: 'GET', path: '/v1/payments/payment-123' }],
    ]);
  });

  it('pins the identity client to IdentityClientContract', async () => {
    const client: IdentityClientContract = sdk.identity;
    const resolveInput = { stellarAddress: 'GIDENTITY' };
    const verifyInput = {
      identityId: 'identity-123',
      challenge: 'challenge',
      signature: 'signature',
    };

    await client.resolve(resolveInput);
    await client.verify(verifyInput);

    expect(requestSpy.mock.calls).toEqual([
      [
        {
          method: 'POST',
          path: '/v1/identity/resolve',
          body: resolveInput,
        },
      ],
      [
        {
          method: 'POST',
          path: '/v1/identity/verify',
          body: verifyInput,
        },
      ],
    ]);
  });

  it('pins the system client to SystemClientContract', async () => {
    const client: SystemClientContract = sdk.system;

    await client.health();
    await client.info();

    expect(requestSpy.mock.calls).toEqual([
      [{ method: 'GET', path: '/v1/system/health' }],
      [{ method: 'GET', path: '/v1/system/info' }],
    ]);
  });
});
