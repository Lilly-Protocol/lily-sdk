import { LilySdk } from '../src';

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
            recoveryHint:
              'Store recovery materials securely outside your runtime.',
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

async function main(): Promise<void> {
  const health = await sdk.system.health();
  const wallet = await sdk.wallets.provision({
    agentId: 'agent_demo_123',
    network: 'stellar-testnet',
  });

  console.log('Service health:', health.status, health.version);
  console.log('Provisioned wallet:', wallet.wallet.id, wallet.wallet.address);
}

await main();
