import { describe, it, expect } from 'vitest';
import { AgentClient } from '../src/clients/agent-client';
import { WalletClient } from '../src/clients/wallet-client';
import { PaymentClient } from '../src/clients/payment-client';
import type { HttpClient } from '../src/http/types';

describe('Path parameter encoding in clients', () => {
  const createMockHttpClient = (): HttpClient & { lastRequest?: unknown } => {
    const state: { lastRequest?: unknown } = {};
    return {
      request: ((request: unknown) => {
        state.lastRequest = request;
        return Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: {},
        });
      }) as HttpClient['request'],
      get lastRequest() {
        return state.lastRequest;
      },
    };
  };

  it('AgentClient.get encodes special characters in agentId', async () => {
    const mock = createMockHttpClient();
    const client = new AgentClient(mock);
    await client.get('agent/with?special#chars');
    expect(mock.lastRequest).toEqual(
      expect.objectContaining({
        path: '/v1/agents/agent%2Fwith%3Fspecial%23chars',
      }),
    );
  });

  it('AgentClient.update encodes special characters in agentId', async () => {
    const mock = createMockHttpClient();
    const client = new AgentClient(mock);
    await client.update('agent/id with spaces', { name: 'test' });
    expect(mock.lastRequest).toEqual(
      expect.objectContaining({
        path: '/v1/agents/agent%2Fid%20with%20spaces',
      }),
    );
  });

  it('WalletClient.get encodes special characters in walletId', async () => {
    const mock = createMockHttpClient();
    const client = new WalletClient(mock);
    await client.get('wallet?id=test');
    expect(mock.lastRequest).toEqual(
      expect.objectContaining({
        path: '/v1/wallets/wallet%3Fid%3Dtest',
      }),
    );
  });

  it('PaymentClient.get encodes special characters in paymentId', async () => {
    const mock = createMockHttpClient();
    const client = new PaymentClient(mock);
    await client.get('payment#123/456');
    expect(mock.lastRequest).toEqual(
      expect.objectContaining({
        path: '/v1/payments/payment%23123%2F456',
      }),
    );
  });
});
