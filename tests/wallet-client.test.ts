import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletClient } from '../src/clients/wallet-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type {
  Wallet,
  ProvisionWalletRequest,
  WalletProvisioningResult,
} from '../src/models';

function createMockHttpClient(responseData: unknown = {}): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: responseData,
    } as HttpResponse),
  };
}

const mockWallet: Wallet = {
  id: 'wallet-1',
  agentId: 'agent-1',
  address: 'GABC...',
  network: 'stellar-testnet',
  status: 'active',
  balances: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('WalletClient', () => {
  let httpClient: HttpClient;
  let client: WalletClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    client = new WalletClient(httpClient);
  });

  describe('provision', () => {
    it('rejects with LilyValidationError before HTTP request if agentId is empty', async () => {
      const input = {
        agentId: '',
        network: 'stellar-testnet' as const,
      };
      await expect(client.provision(input)).rejects.toThrow(
        LilyValidationError,
      );
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects with LilyValidationError before HTTP request if network is invalid', async () => {
      const input = {
        agentId: 'agent-1',
        network: 'bitcoin' as any,
      };
      await expect(client.provision(input)).rejects.toThrow(
        LilyValidationError,
      );
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects with LilyValidationError if fundingAsset has empty assetCode', async () => {
      const input: ProvisionWalletRequest = {
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: { assetCode: '', amount: '100' },
      };
      await expect(client.provision(input)).rejects.toThrow(
        LilyValidationError,
      );
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects with LilyValidationError if fundingAsset has invalid amount', async () => {
      const input: ProvisionWalletRequest = {
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: { assetCode: 'XLM', amount: 'invalid-amount' },
      };
      await expect(client.provision(input)).rejects.toThrow(
        LilyValidationError,
      );
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('sends POST /v1/wallets/provision with the input body and returns result', async () => {
      const input: ProvisionWalletRequest = {
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: { assetCode: 'XLM', amount: '100' },
      };
      const result: WalletProvisioningResult = {
        wallet: mockWallet,
        recoveryHint: 'some-hint',
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 201,
        headers: new Headers(),
        data: result,
      } as HttpResponse);

      const response = await client.provision(input);

      expect(response.wallet.id).toBe('wallet-1');
      expect(response.recoveryHint).toBe('some-hint');
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/wallets/provision',
        body: input,
      });
    });
  });

  describe('get', () => {
    it('rejects with LilyValidationError if walletId is empty', async () => {
      await expect(client.get('')).rejects.toThrow(LilyValidationError);
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('sends GET /v1/wallets/:id and returns the wallet', async () => {
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockWallet,
      } as HttpResponse);

      const result = await client.get('wallet-1');

      expect(result).toEqual(mockWallet);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/wallets/wallet-1',
      });
    });
  });
});
