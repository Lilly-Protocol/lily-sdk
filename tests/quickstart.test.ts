import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src';

describe('examples/quickstart.ts flow', () => {
  it('executes health and wallet provision against a stubbed fetch', async () => {
    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.example',
      authToken: 'demo-token',
      fetch: (_input, init) => {
        const requestUrl =
          typeof _input === 'string'
            ? _input
            : _input instanceof URL
              ? _input.toString()
              : _input.url;

        if (requestUrl.endsWith('/v1/system/health')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                status: 'ok',
                version: '0.1.0',
                timestamp: new Date().toISOString(),
                checks: {
                  api: 'ok',
                  walletService: 'ok',
                },
              }),
              {
                status: 200,
                headers: {
                  'content-type': 'application/json',
                },
              },
            ),
          );
        }

        if (requestUrl.endsWith('/v1/wallets/provision')) {
          const rawBody = typeof init?.body === 'string' ? init.body : '{}';
          const body = JSON.parse(rawBody) as { agentId: string; network: string };

          return Promise.resolve(
            new Response(
              JSON.stringify({
                wallet: {
                  id: 'wal_demo_123',
                  agentId: body.agentId,
                  address: 'GDEMOEXAMPLEADDRESS1234567890',
                  network: body.network,
                  status: 'active',
                  balances: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                recoveryHint: 'Store recovery materials securely outside your runtime.',
              }),
              {
                status: 200,
                headers: {
                  'content-type': 'application/json',
                },
              },
            ),
          );
        }

        return Promise.resolve(new Response('Not found', { status: 404 }));
      },
    });

    const health = await sdk.system.health();
    expect(health.status).toBe('ok');
    expect(health.version).toBe('0.1.0');

    const walletResult = await sdk.wallets.provision({
      agentId: 'agent_demo_123',
      network: 'stellar-testnet',
    });

    expect(walletResult.wallet.id).toBe('wal_demo_123');
    expect(walletResult.wallet.address).toBe('GDEMOEXAMPLEADDRESS1234567890');
    expect(walletResult.wallet.network).toBe('stellar-testnet');
  });
});
