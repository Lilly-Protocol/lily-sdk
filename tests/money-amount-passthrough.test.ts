import { describe, expect, it } from 'vitest';

const TEST_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';
import type { HttpRequest } from '../src/http/types';

describe('MoneyAmount decimal passthrough', () => {
  const amounts = ['1', '1.0', '01.5', '0.000001'];

  for (const amount of amounts) {
    it(`passes "${amount}" unchanged through PaymentClient.quote`, async () => {
      let capturedBody: unknown;

      const httpClient = createMockHttpClient(async (req: HttpRequest) => {
        capturedBody = req.body;
        return {
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          data: {
            amount: { assetCode: 'USDC', amount },
            estimatedFee: { assetCode: 'USDC', amount: '0.01' },
            expiresAt: '2026-08-26T00:00:00Z',
          },
        };
      });

      const sdk = new LilySdk(
        { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
        httpClient,
      );

      await sdk.payments.quote({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount },
      });

      expect((capturedBody as any).amount.amount).toBe(amount);
    });

    it(`passes "${amount}" unchanged through PaymentClient.execute`, async () => {
      let capturedBody: unknown;

      const httpClient = createMockHttpClient(async (req: HttpRequest) => {
        capturedBody = req.body;
        return {
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          data: {
            id: 'pay-1',
            fromWalletId: 'wallet-1',
            toAddress: 'GABC...',
            amount: { assetCode: 'USDC', amount },
            status: 'queued',
            createdAt: '2026-08-26T00:00:00Z',
            updatedAt: '2026-08-26T00:00:00Z',
          },
        };
      });

      const sdk = new LilySdk(
        { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
        httpClient,
      );

      await sdk.payments.execute({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount },
      });

      expect((capturedBody as any).amount.amount).toBe(amount);
    });
  }
});
