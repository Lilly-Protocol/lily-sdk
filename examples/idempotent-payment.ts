/**
 * Example: idempotent payment execution with retries.
 * Bounty #107 — $35
 */
import { LilySdk } from '../src';

const sdk = new LilySdk({
  baseUrl: 'https://api.lily.example',
  authToken: 'demo-token',
  retry: { retries: 2, retryDelayMs: 50 },
  fetch: async () => {
    return new Response(
      JSON.stringify({
        id: 'pay_123',
        fromWalletId: 'wal_1',
        toAddress: 'GABC123',
        amount: { assetCode: 'USDC', amount: '10.00' },
        status: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  },
});

async function main(): Promise<void> {
  const idempotencyKey = `payment_${Date.now()}`;

  const payment = await sdk.payments.execute({
    fromWalletId: 'wal_1',
    toAddress: 'GABC123',
    amount: { assetCode: 'USDC', amount: '10.00' },
    idempotencyKey,
  });

  console.log('Payment created:', payment.id, payment.status);

  // Re-execute with the same idempotency key — should return the same payment
  const retry = await sdk.payments.execute({
    fromWalletId: 'wal_1',
    toAddress: 'GABC123',
    amount: { assetCode: 'USDC', amount: '10.00' },
    idempotencyKey,
  });

  console.log('Idempotent retry:', retry.id === payment.id ? 'same payment ✓' : 'different payment ✗');
}

await main();
