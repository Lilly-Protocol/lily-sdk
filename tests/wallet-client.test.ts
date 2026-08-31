import { describe, expect, it } from 'vitest';
import type { HttpRequest } from '../src/http/types';
import type {
  ProvisionWalletRequest,
  Wallet,
  WalletProvisioningResult,
} from '../src/models';
import { WalletClient } from '../src/clients/wallet-client';
import { createMockHttpClient } from './helpers/mock-http-client';

const stubWallet: Wallet = {
  id: 'wallet-1',
  agentId: 'agent-1',
  address: 'GABC123',
  network: 'stellar-testnet',
  status: 'active',
  balances: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('WalletClient', () => {
  it('provision sends POST /v1/wallets/provision with body and returns result', async () => {
    let captured: HttpRequest<ProvisionWalletRequest> | undefined;
    const input: ProvisionWalletRequest = {
      agentId: 'agent-1',
      network: 'stellar-testnet',
      fundingAsset: { assetCode: 'XLM', amount: '100' },
    };
    const expectedResult: WalletProvisioningResult = {
      wallet: stubWallet,
      recoveryHint: 'hint-abc',
    };

    const client = new WalletClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<ProvisionWalletRequest>;
        return { status: 200, data: expectedResult };
      }),
    );

    const result = await client.provision(input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('POST');
    expect(captured!.path).toBe('/v1/wallets/provision');
    expect(captured!.body).toEqual(input);
    expect(result).toEqual(expectedResult);
  });

  it('get sends GET /v1/wallets/:id and returns wallet', async () => {
    let captured: HttpRequest<undefined> | undefined;
    const client = new WalletClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<undefined>;
        return { status: 200, data: stubWallet };
      }),
    );

    const result = await client.get('wallet-1');

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('GET');
    expect(captured!.path).toBe('/v1/wallets/wallet-1');
    expect(result).toEqual(stubWallet);
  });
});
