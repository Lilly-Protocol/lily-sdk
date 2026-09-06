/**
 * Example: Unit testing with MockHttpClient and per-request response stubs.
 * Issue #451: Publish a lightweight in-memory HttpClient for SDK consumer unit tests
 */
import { LilySdk } from '../src';
import { createMockHttpClient } from '../src/testing';
import type { RecordedHttpRequest } from '../src/testing';

async function main(): Promise<void> {
  console.log('--- Initializing MockHttpClient ---');

  // 1. Create a scriptable in-memory HttpClient
  const mockHttp = createMockHttpClient({
    onRequest: (req: RecordedHttpRequest) => {
      console.log(`[MockHttpClient] Intercepted: ${req.method} ${req.path}`);
    },
  });

  // 2. Define per-request response stubs
  mockHttp
    .onGet('/v1/system/health', {
      status: 'healthy',
      version: '1.0.0',
      network: 'stellar-testnet',
      timestamp: new Date().toISOString(),
    })
    .onGet('/v1/agents', [
      {
        id: 'agent_01',
        name: 'Autonomous Arbitrageur',
        status: 'active',
        network: 'stellar-testnet',
        capabilities: ['trading', 'payments'],
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ])
    .onPost('/v1/wallets/provision', {
      status: 201,
      data: {
        wallet: {
          id: 'wallet_abc',
          agentId: 'agent_01',
          address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
          network: 'stellar-testnet',
          status: 'active',
          balances: [{ amount: '100', assetCode: 'XLM' }],
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      },
    });

  // 3. Inject mock into LilySdk — no network requests, no retries/timeouts needed
  const sdk = new LilySdk({ baseUrl: 'https://api.lily.test' }, mockHttp);

  // 4. Exercise the SDK
  const health = await sdk.system.health();
  console.log('Health status:', health.status);

  const agents = await sdk.agents.list();
  console.log(`Retrieved ${agents.length} agent(s):`, agents[0]?.name);

  const walletResult = await sdk.wallets.provision({
    agentId: 'agent_01',
    network: 'stellar-testnet',
  });
  console.log('Provisioned wallet address:', walletResult.wallet.address);

  // 5. Assert recorded requests
  mockHttp.assertCalled(3);
  mockHttp.assertLastRequest({
    method: 'POST',
    path: '/v1/wallets/provision',
    body: { agentId: 'agent_01', network: 'stellar-testnet' },
  });

  console.log(
    '✅ All requests verified successfully with MockHttpClient assertions!',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
