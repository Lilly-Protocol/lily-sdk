import { describe, it, expect } from 'vitest';
import { WalletClient } from '../src/clients/wallet-client.js';
import type { HttpClient, HttpResponse } from '../src/http/types.js';
import type { ProvisionWalletRequest, WalletProvisioningResult, Wallet } from '../src/models/wallet.js';

function createMockHttpClient(responses: Record<string, unknown>): HttpClient {
  return {
    request: <TResponse>(input: { method: string; path: string }): Promise<HttpResponse<TResponse>> => {
      const key = `${input.method} ${input.path}`;
      const data = responses[key];
      if (!data) throw new Error(`No mock for ${key}`);
      return Promise.resolve({
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        data: data as TResponse,
      });
    },
  };
}

const mockWallet: Wallet = {
  id: 'w1',
  agentId: 'a1',
  address: 'GABC',
  network: 'stellar-testnet',
  status: 'active',
  balances: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('WalletClient', () => {
  it('provision sends correct request and returns result', async () => {
    const expected: WalletProvisioningResult = {
      wallet: mockWallet,
      recoveryHint: 'hint-123',
    };
    const http = createMockHttpClient({ 'POST /v1/wallets/provision': expected });
    const client = new WalletClient(http);

    const input: ProvisionWalletRequest = {
      agentId: 'a1',
      network: 'stellar-testnet',
      fundingAsset: { assetCode: 'XLM', amount: '100' },
    };

    const result = await client.provision(input);
    expect(result).toEqual(expected);
  });

  it('get sends correct request and returns wallet', async () => {
    const expected: Wallet = { ...mockWallet, network: 'stellar-mainnet', address: 'GDEF' };
    const http = createMockHttpClient({ 'GET /v1/wallets/w1': expected });
    const client = new WalletClient(http);

    const result = await client.get('w1');
    expect(result).toEqual(expected);
  });
});
