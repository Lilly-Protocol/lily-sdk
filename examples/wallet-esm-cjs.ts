// ESM/CJS smoke example for wallet provisioning (issue #4)
// 
// ESM usage:
//   import { LilySdk } from 'lily-sdk';
//
// CJS usage:
//   const { LilySdk } = require('lily-sdk');

import { LilySdk } from '../src/index';

async function main() {
  const sdk = new LilySdk({
    baseUrl: process.env.LILY_BASE_URL || 'https://api.lily.io',
    apiKey: process.env.LILY_API_KEY || 'lk_test_demo',
  });

  // List wallets
  const wallets = await sdk.wallets.list();
  console.log('Wallets:', wallets);

  // Create a payment to provision a wallet
  const payment = await sdk.payments.create({
    amount: '10.00',
    currency: 'USD',
  });
  console.log('Payment created:', payment);
}

main().catch(console.error);
