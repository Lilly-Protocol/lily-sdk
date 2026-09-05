import { describe, expect, it, vi, beforeEach } from 'vitest';
import { WalletClient } from '../src/clients/wallet-client';
import { AgentClient } from '../src/clients/agent-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type {
  CreateAgentRequest,
  ProvisionWalletRequest,
  UpdateAgentRequest,
} from '../src/models';

function createMockHttpClient(): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { id: 'mock_result', ok: true },
    } as HttpResponse),
  };
}

describe('Issue #412: Client-side Request Validation', () => {
  let httpClient: HttpClient;
  let walletClient: WalletClient;
  let agentClient: AgentClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    walletClient = new WalletClient(httpClient);
    agentClient = new AgentClient(httpClient);
  });

  describe('WalletClient.provision', () => {
    it('accepts valid provision request and sends HTTP POST', async () => {
      const input: ProvisionWalletRequest = {
        agentId: 'agent_123',
        network: 'stellar-testnet',
        fundingAsset: { assetCode: 'XLM', amount: '50.00' },
      };
      const result = await walletClient.provision(input);
      expect(result).toBeDefined();
      expect(httpClient.request).toHaveBeenCalledTimes(1);
    });

    it('rejects empty or whitespace agentId without dispatching HTTP', async () => {
      await expect(
        walletClient.provision({
          agentId: '',
          network: 'stellar-testnet',
        }),
      ).rejects.toThrow(LilyValidationError);

      await expect(
        walletClient.provision({
          agentId: '   ',
          network: 'stellar-testnet',
        }),
      ).rejects.toThrow(LilyValidationError);

      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects invalid network identifier', async () => {
      await expect(
        walletClient.provision({
          agentId: 'agent_123',
          network: 'solana-mainnet' as any,
        }),
      ).rejects.toThrow(/stellar-testnet/);
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects malformed fundingAsset assetCode and amount', async () => {
      await expect(
        walletClient.provision({
          agentId: 'agent_123',
          network: 'stellar-testnet',
          fundingAsset: { assetCode: 'INVALID_TOO_LONG_12345', amount: '10' },
        }),
      ).rejects.toThrow(/assetCode/);

      await expect(
        walletClient.provision({
          agentId: 'agent_123',
          network: 'stellar-testnet',
          fundingAsset: { assetCode: 'XLM', amount: '-10' },
        }),
      ).rejects.toThrow(/amount/);

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('AgentClient.create', () => {
    it('accepts valid create request and sends HTTP POST', async () => {
      const input: CreateAgentRequest = {
        name: 'Research Agent',
        network: 'stellar-mainnet',
        capabilities: ['search', 'analyze'],
      };
      const result = await agentClient.create(input);
      expect(result).toBeDefined();
      expect(httpClient.request).toHaveBeenCalledTimes(1);
    });

    it('rejects empty or whitespace agent name', async () => {
      await expect(
        agentClient.create({
          name: '',
          network: 'stellar-testnet',
        }),
      ).rejects.toThrow(LilyValidationError);

      await expect(
        agentClient.create({
          name: '   ',
          network: 'stellar-testnet',
        }),
      ).rejects.toThrow(LilyValidationError);

      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects invalid agent network', async () => {
      await expect(
        agentClient.create({
          name: 'Agent X',
          network: 'polygon' as any,
        }),
      ).rejects.toThrow(/network/);
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects invalid capabilities list', async () => {
      await expect(
        agentClient.create({
          name: 'Agent X',
          network: 'stellar-testnet',
          capabilities: 'not-an-array' as any,
        }),
      ).rejects.toThrow(/capabilities/);

      await expect(
        agentClient.create({
          name: 'Agent X',
          network: 'stellar-testnet',
          capabilities: ['search', '   '],
        }),
      ).rejects.toThrow(/each capability/);

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('AgentClient.update', () => {
    it('accepts valid update request and sends HTTP PATCH', async () => {
      const input: UpdateAgentRequest = {
        status: 'active',
      };
      const result = await agentClient.update('agent_123', input);
      expect(result).toBeDefined();
      expect(httpClient.request).toHaveBeenCalledTimes(1);
    });

    it('rejects empty or whitespace agentId', async () => {
      await expect(
        agentClient.update('', { name: 'New Name' }),
      ).rejects.toThrow(/agentId/);

      await expect(
        agentClient.update('   ', { name: 'New Name' }),
      ).rejects.toThrow(/agentId/);

      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects empty update body with no modified fields', async () => {
      await expect(
        agentClient.update('agent_123', {}),
      ).rejects.toThrow(/at least one update field/);

      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('rejects invalid status value', async () => {
      await expect(
        agentClient.update('agent_123', { status: 'terminated' as any }),
      ).rejects.toThrow(/status/);

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });
});
