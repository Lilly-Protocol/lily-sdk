import { describe, expect, it, vi } from 'vitest';

import type { Wallet, WalletProvisioningResult } from '../src/models';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('WalletClient', () => {
  it('provision sends POST /v1/wallets/provision with ProvisionWalletRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: {
          wallet: {
            id: 'wallet-123',
            agentId: 'agent-001',
            address: 'GABC123...',
            network: 'stellar-testnet',
            status: 'active',
            balances: [],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          recoveryHint: 'rh-abc',
        } satisfies WalletProvisioningResult,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = {
      agentId: 'agent-001',
      network: 'stellar-testnet' as const,
    };

    const result = await sdk.wallets.provision(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/wallets/provision',
      body: input,
    });
    expect(result.wallet.id).toBe('wallet-123');
    expect(result.wallet.agentId).toBe('agent-001');
    expect(result.wallet.network).toBe('stellar-testnet');
    expect(result.recoveryHint).toBe('rh-abc');
  });

  it('provision with fundingAsset sends the full body including funding details', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: {
          wallet: {
            id: 'wallet-456',
            agentId: 'agent-002',
            address: 'GDEF456...',
            network: 'stellar-mainnet',
            status: 'active',
            balances: [{ assetCode: 'USDC', amount: '100.00' }],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = {
      agentId: 'agent-002',
      network: 'stellar-mainnet' as const,
      fundingAsset: {
        assetCode: 'USDC',
        amount: '100.00',
      },
    };

    const result = await sdk.wallets.provision(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/wallets/provision',
      body: input,
    });
    expect(result.wallet.id).toBe('wallet-456');
    expect(result.wallet.balances[0].assetCode).toBe('USDC');
  });

  it('get sends GET /v1/wallets/:id', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'wallet-789',
          agentId: 'agent-003',
          address: 'GXYZ789...',
          network: 'stellar-testnet',
          status: 'active',
          balances: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } satisfies Wallet,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const wallet = await sdk.wallets.get('wallet-789');

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/wallets/wallet-789',
    });
    expect(wallet.id).toBe('wallet-789');
    expect(wallet.agentId).toBe('agent-003');
    expect(wallet.address).toBe('GXYZ789...');
    expect(wallet.network).toBe('stellar-testnet');
    expect(wallet.status).toBe('active');
  });

  it('get passes the wallet ID into the URL path', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'w-1',
          agentId: 'a-1',
          address: 'addr',
          network: 'stellar-testnet',
          status: 'active',
          balances: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.wallets.get('w-1');

    const call = requestSpy.mock.calls[0][0];
    expect(call.method).toBe('GET');
    expect(call.path).toContain('w-1');
    expect(call.path).toBe('/v1/wallets/w-1');
  });

  it('provision return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      wallet: {
        id: 'w-passthrough',
        agentId: 'a-pt',
        address: 'GPT...',
        network: 'stellar-mainnet',
        status: 'provisioning',
        balances: [{ assetCode: 'XLM', amount: '500' }],
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
      },
      recoveryHint: 'secret-hint',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.wallets.provision({
      agentId: 'a-pt',
      network: 'stellar-mainnet',
    });

    // Assert the entire response data is passed through without modification
    expect(result).toEqual(mockData);
  });

  it('get return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'w-pt2',
      agentId: 'a-pt2',
      address: 'GPT2...',
      network: 'stellar-testnet',
      status: 'suspended',
      balances: [
        { assetCode: 'USDC', amount: '0.00' },
        { assetCode: 'XLM', amount: '1.5' },
      ],
      createdAt: '2026-03-15T10:30:00Z',
      updatedAt: '2026-03-16T12:00:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.wallets.get('w-pt2');

    expect(result).toEqual(mockData);
  });
});
