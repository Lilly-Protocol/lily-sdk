import { describe, expect, it, vi } from 'vitest';
import { AgentClient } from '../src/clients/agent-client';
import { WalletClient } from '../src/clients/wallet-client';
import { PaymentClient } from '../src/clients/payment-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient } from '../src/http/types';

function createMockHttpClient() {
  const requestSpy = vi.fn().mockResolvedValue({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    data: {},
    attempts: 1,
    retried: false,
  });

  const client: HttpClient = {
    request: requestSpy,
  };

  return { client, requestSpy };
}

describe('Reject empty and whitespace-only IDs across client methods (issue #443)', () => {
  describe('AgentClient', () => {
    it.each(['', '   ', '\t', '\n'])(
      'rejects invalid agentId on get(%j)',
      async (invalidId) => {
        const { client, requestSpy } = createMockHttpClient();
        const agentClient = new AgentClient(client);

        await expect(agentClient.get(invalidId)).rejects.toThrow(
          LilyValidationError,
        );
        await expect(agentClient.get(invalidId)).rejects.toThrow(
          '`agentId` must be a non-empty string.',
        );
        expect(requestSpy).not.toHaveBeenCalled();
      },
    );

    it.each(['', '   ', '\t', '\n'])(
      'rejects invalid agentId on update(%j)',
      async (invalidId) => {
        const { client, requestSpy } = createMockHttpClient();
        const agentClient = new AgentClient(client);

        await expect(
          agentClient.update(invalidId, { name: 'New Name' }),
        ).rejects.toThrow(LilyValidationError);
        await expect(
          agentClient.update(invalidId, { name: 'New Name' }),
        ).rejects.toThrow('`agentId` must be a non-empty string.');
        expect(requestSpy).not.toHaveBeenCalled();
      },
    );

    it.each(['', '   ', '\t', '\n'])(
      'rejects invalid agentId on delete(%j)',
      async (invalidId) => {
        const { client, requestSpy } = createMockHttpClient();
        const agentClient = new AgentClient(client);

        await expect(agentClient.delete(invalidId)).rejects.toThrow(
          LilyValidationError,
        );
        await expect(agentClient.delete(invalidId)).rejects.toThrow(
          '`agentId` must be a non-empty string.',
        );
        expect(requestSpy).not.toHaveBeenCalled();
      },
    );
  });

  describe('WalletClient', () => {
    it.each(['', '   ', '\t', '\n'])(
      'rejects invalid walletId on get(%j)',
      async (invalidId) => {
        const { client, requestSpy } = createMockHttpClient();
        const walletClient = new WalletClient(client);

        await expect(walletClient.get(invalidId)).rejects.toThrow(
          LilyValidationError,
        );
        await expect(walletClient.get(invalidId)).rejects.toThrow(
          '`walletId` must be a non-empty string.',
        );
        expect(requestSpy).not.toHaveBeenCalled();
      },
    );
  });

  describe('PaymentClient', () => {
    it.each(['', '   ', '\t', '\n'])(
      'rejects invalid paymentId on get(%j)',
      async (invalidId) => {
        const { client, requestSpy } = createMockHttpClient();
        const paymentClient = new PaymentClient(client);

        await expect(paymentClient.get(invalidId)).rejects.toThrow(
          LilyValidationError,
        );
        await expect(paymentClient.get(invalidId)).rejects.toThrow(
          '`paymentId` must be a non-empty string.',
        );
        expect(requestSpy).not.toHaveBeenCalled();
      },
    );
  });

  describe('Valid non-empty IDs', () => {
    it('allows valid non-empty IDs to issue HTTP requests', async () => {
      const { client, requestSpy } = createMockHttpClient();
      const agentClient = new AgentClient(client);
      const walletClient = new WalletClient(client);
      const paymentClient = new PaymentClient(client);

      await agentClient.get('agent_123');
      await agentClient.update('agent_123', { name: 'agent' });
      await agentClient.delete('agent_123');
      await walletClient.get('wallet_456');
      await paymentClient.get('payment_789');

      expect(requestSpy).toHaveBeenCalledTimes(5);
    });
  });
});
