import { describe, expect, it, vi } from 'vitest';

import { WalletClient } from '../src/clients/wallet-client';
import type { ProvisionWalletRequest, Wallet, WalletProvisioningResult } from '../src/models';
import { createMockHttpClient } from './helpers/mock-http-client';

const wallet: Wallet = {
  id: 'wallet-123',
  agentId: 'agent-123',
  address: 'GABC123',
  network: 'stellar-testnet',
  status: 'active',
  balances: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('WalletClient', () => {
  it('provisions a wallet with the supplied request body and returns the response data', async () => {
    const input: ProvisionWalletRequest = {
      agentId: 'agent-123',
      network: 'stellar-testnet',
      fundingAsset: {
        assetCode: 'USDC',
        amount: '25.00',
      },
    };
    const result: WalletProvisioningResult = {
      wallet,
      recoveryHint: 'Store recovery material securely.',
    };
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: result,
      }),
    );
    const client = new WalletClient(createMockHttpClient(requestSpy));

    const response = await client.provision(input);

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/wallets/provision',
      body: input,
    });
    expect(response).toBe(result);
  });

  it('gets a wallet by id and returns the response data', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: wallet,
      }),
    );
    const client = new WalletClient(createMockHttpClient(requestSpy));

    const response = await client.get('wallet-123');

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/wallets/wallet-123',
    });
    expect(response).toBe(wallet);
  });
});
