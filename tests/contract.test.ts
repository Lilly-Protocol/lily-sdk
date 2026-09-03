import { describe, expect, it, vi } from 'vitest';

import type {
  AgentClientContract,
  IdentityClientContract,
  PaymentClientContract,
  SystemClientContract,
  WalletClientContract,
} from '../src/types/contracts';
import { AgentClient } from '../src/clients/agent-client';
import { IdentityClient } from '../src/clients/identity-client';
import { PaymentClient } from '../src/clients/payment-client';
import { SystemClient } from '../src/clients/system-client';
import { WalletClient } from '../src/clients/wallet-client';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client contracts', () => {
  it('AgentClient satisfies AgentClientContract', async () => {
    const requestSpy = vi.fn(() => Promise.resolve({ status: 200, headers: new Headers(), data: [] }));
    const client: AgentClientContract = new AgentClient(createMockHttpClient(requestSpy));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.list).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.get).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.create).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.update).toBeDefined();

    await client.list();
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/v1/agents' }),
    );
  });

  it('WalletClient satisfies WalletClientContract', async () => {
    const requestSpy = vi.fn(() => Promise.resolve({ status: 200, headers: new Headers(), data: {} }));
    const client: WalletClientContract = new WalletClient(createMockHttpClient(requestSpy));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.provision).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.get).toBeDefined();

    await client.get('w-1');
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/v1/wallets/w-1' }),
    );
  });

  it('PaymentClient satisfies PaymentClientContract', async () => {
    const requestSpy = vi.fn(() => Promise.resolve({ status: 200, headers: new Headers(), data: {} }));
    const client: PaymentClientContract = new PaymentClient(createMockHttpClient(requestSpy));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.quote).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.execute).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.get).toBeDefined();

    await client.get('p-1');
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/v1/payments/p-1' }),
    );
  });

  it('IdentityClient satisfies IdentityClientContract', async () => {
    const requestSpy = vi.fn(() => Promise.resolve({ status: 200, headers: new Headers(), data: {} }));
    const client: IdentityClientContract = new IdentityClient(createMockHttpClient(requestSpy));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.resolve).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.verify).toBeDefined();

    await client.resolve({ agentId: 'a-1' });
    expect(requestSpy).toHaveBeenCalled();
  });

  it('SystemClient satisfies SystemClientContract', async () => {
    const requestSpy = vi.fn(() => Promise.resolve({ status: 200, headers: new Headers(), data: {} }));
    const client: SystemClientContract = new SystemClient(createMockHttpClient(requestSpy));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.health).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.info).toBeDefined();

    await client.health();
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/v1/system/health' }),
    );
  });
});
