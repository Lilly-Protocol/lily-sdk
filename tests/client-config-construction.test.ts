import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgentClient } from '../src/clients/agent-client';
import { IdentityClient } from '../src/clients/identity-client';
import { PaymentClient } from '../src/clients/payment-client';
import { SystemClient } from '../src/clients/system-client';
import { WalletClient } from '../src/clients/wallet-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type {
  Agent,
  HealthStatus,
  IdentityProfile,
  Payment,
  Wallet,
} from '../src/models';

const BASE_URL = 'https://config-client.example.test/';

const mockAgent: Agent = {
  id: 'agent-1',
  name: 'Config Agent',
  status: 'active',
  capabilities: ['search'],
  createdAt: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-09-03T00:00:00.000Z',
};

const mockWallet: Wallet = {
  id: 'wallet-1',
  agentId: 'agent-1',
  address: 'GABC...',
  network: 'stellar-testnet',
  status: 'active',
  balances: [],
  createdAt: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-09-03T00:00:00.000Z',
};

const mockPayment: Payment = {
  id: 'pay-1',
  fromWalletId: 'wallet-1',
  toAddress: 'GABC...',
  amount: { amount: '100', assetCode: 'XLM' },
  status: 'settled',
  createdAt: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-09-03T00:00:00.000Z',
};

const mockIdentity: IdentityProfile = {
  id: 'id-1',
  agentId: 'agent-1',
  displayName: 'Config Identity',
  stellarAddress: 'GABC...',
  domain: 'example.test',
  status: 'active',
  verificationLevel: 'enhanced',
  createdAt: '2026-09-03T00:00:00.000Z',
  updatedAt: '2026-09-03T00:00:00.000Z',
};

const mockHealth: HealthStatus = {
  status: 'ok',
  version: '1.0.0',
  timestamp: '2026-09-03T00:00:00.000Z',
  checks: { database: 'ok', redis: 'ok' },
};

function installJsonFetch(payload: unknown) {
  const fetchMock = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function firstRequestedUrl(
  fetchMock: ReturnType<typeof installJsonFetch>,
): string {
  return String(fetchMock.mock.calls[0]![0]);
}

describe('clients constructed from resolved config', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('AgentClient uses the config baseUrl and parses the response', async () => {
    const fetchMock = installJsonFetch(mockAgent);
    const client = new AgentClient(
      resolveLilySdkConfig({ baseUrl: BASE_URL }),
    );

    const result = await client.get('agent-1');

    expect(result).toEqual(mockAgent);
    expect(firstRequestedUrl(fetchMock)).toBe(
      `${BASE_URL}v1/agents/agent-1`,
    );
  });

  it('WalletClient uses the config baseUrl and parses the response', async () => {
    const fetchMock = installJsonFetch(mockWallet);
    const client = new WalletClient(
      resolveLilySdkConfig({ baseUrl: BASE_URL }),
    );

    const result = await client.get('wallet-1');

    expect(result).toEqual(mockWallet);
    expect(firstRequestedUrl(fetchMock)).toBe(
      `${BASE_URL}v1/wallets/wallet-1`,
    );
  });

  it('PaymentClient uses the config baseUrl and parses the response', async () => {
    const fetchMock = installJsonFetch(mockPayment);
    const client = new PaymentClient(
      resolveLilySdkConfig({ baseUrl: BASE_URL }),
    );

    const result = await client.get('pay-1');

    expect(result).toEqual(mockPayment);
    expect(firstRequestedUrl(fetchMock)).toBe(
      `${BASE_URL}v1/payments/pay-1`,
    );
  });

  it('IdentityClient uses the config baseUrl and parses the response', async () => {
    const fetchMock = installJsonFetch(mockIdentity);
    const client = new IdentityClient(
      resolveLilySdkConfig({ baseUrl: BASE_URL }),
    );

    const result = await client.get('id-1');

    expect(result).toEqual(mockIdentity);
    expect(firstRequestedUrl(fetchMock)).toBe(
      `${BASE_URL}v1/identity/id-1`,
    );
  });

  it('SystemClient uses the config baseUrl and parses a valid health response', async () => {
    const fetchMock = installJsonFetch(mockHealth);
    const client = new SystemClient(
      resolveLilySdkConfig({
        baseUrl: BASE_URL,
        validateResponses: true,
      }),
    );

    const result = await client.health();

    expect(result).toEqual(mockHealth);
    expect(firstRequestedUrl(fetchMock)).toBe(
      `${BASE_URL}v1/system/health`,
    );
  });

  it('SystemClient enables health validation from resolved config', async () => {
    const fetchMock = installJsonFetch({
      status: 'definitely-not-valid',
      version: 123,
    });
    const client = new SystemClient(
      resolveLilySdkConfig({
        baseUrl: BASE_URL,
        validateResponses: true,
      }),
    );

    await expect(client.health()).rejects.toBeInstanceOf(
      LilyValidationError,
    );
    expect(firstRequestedUrl(fetchMock)).toBe(
      `${BASE_URL}v1/system/health`,
    );
  });

  it('config-built and HttpClient-built clients behave identically on the same happy path', async () => {
    installJsonFetch(mockAgent);

    const configBuilt = new AgentClient(
      resolveLilySdkConfig({ baseUrl: BASE_URL }),
    );

    const injectedHttpClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: mockAgent,
      } as HttpResponse<Agent>),
    };
    const httpClientBuilt = new AgentClient(injectedHttpClient);

    const [configResult, injectedResult] = await Promise.all([
      configBuilt.get('agent-1'),
      httpClientBuilt.get('agent-1'),
    ]);

    expect(configResult).toEqual(mockAgent);
    expect(injectedResult).toEqual(mockAgent);
    expect(configResult).toEqual(injectedResult);
  });
});
