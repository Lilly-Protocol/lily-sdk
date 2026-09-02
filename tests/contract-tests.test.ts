import { describe, it, expect, vi } from 'vitest';
import { AgentClient } from '../src/clients/agent-client';
import { WalletClient } from '../src/clients/wallet-client';
import { PaymentClient } from '../src/clients/payment-client';
import { IdentityClient } from '../src/clients/identity-client';
import { SystemClient } from '../src/clients/system-client';
import type {
  AgentClientContract,
  WalletClientContract,
  PaymentClientContract,
  IdentityClientContract,
  SystemClientContract,
} from '../src/types/contracts';
import type { HttpClient } from '../src/http/types';

function createMockHttpClient(): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      json: async () => ({}),
      text: async () => '{}',
    }),
  };
}

describe('client contract tests', () => {
  it('AgentClient satisfies AgentClientContract', () => {
    const client: AgentClientContract = new AgentClient(createMockHttpClient());
    expect(typeof client.list).toBe('function');
    expect(typeof client.get).toBe('function');
    expect(typeof client.create).toBe('function');
    expect(typeof client.update).toBe('function');
  });

  it('WalletClient satisfies WalletClientContract', () => {
    const client: WalletClientContract = new WalletClient(createMockHttpClient());
    expect(typeof client.provision).toBe('function');
    expect(typeof client.get).toBe('function');
  });

  it('PaymentClient satisfies PaymentClientContract', () => {
    const client: PaymentClientContract = new PaymentClient(createMockHttpClient());
    expect(typeof client.quote).toBe('function');
    expect(typeof client.execute).toBe('function');
    expect(typeof client.get).toBe('function');
  });

  it('IdentityClient satisfies IdentityClientContract', () => {
    const client: IdentityClientContract = new IdentityClient(createMockHttpClient());
    expect(typeof client.resolve).toBe('function');
    expect(typeof client.verify).toBe('function');
  });

  it('SystemClient satisfies SystemClientContract', () => {
    const client: SystemClientContract = new SystemClient(createMockHttpClient());
    expect(typeof client.health).toBe('function');
    expect(typeof client.info).toBe('function');
  });
});
