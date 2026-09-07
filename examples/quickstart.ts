import { LilySdk, LilyTransportError } from '../src';

async function main(): Promise<void> {
  const sdk = new LilySdk({
    baseUrl: process.env.LILY_API_URL ?? 'https://api.lilyprotocol.org',
    ...(process.env.LILY_API_KEY !== undefined
      ? { apiKey: process.env.LILY_API_KEY }
      : {}),
  });

  const health = await sdk.system.health();
  const wallet = await sdk.wallets.provision({
    agentId: 'agent_demo_123',
    network: 'stellar-testnet',
  });

  console.log('Service health:', health.status, health.version);
  console.log('Provisioned wallet:', wallet.wallet.id, wallet.wallet.address);
}

main().catch((err) => {
  if (err instanceof LilyTransportError) {
    console.warn(
      '⚠  Skipping example: API is unreachable.',
      process.env.CI ? '(CI environment)' : '',
    );
    process.exit(0);
  }
  throw err;
});
