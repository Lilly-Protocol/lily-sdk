import { describe, expect, it, vi } from 'vitest';

import type { HttpRequest } from '../src/http/types';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

const BTC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('MoneyAmount decimal normalization', () => {
  const cases = ['1', '1.0', '01.5', '0.000001'] as const;

  for (const amount of cases) {
    it(`preserves amount "${amount}" unchanged in quote request`, async () => {
      let capturedBody: unknown;
      const requestSpy = vi.fn((req: HttpRequest) => {
        capturedBody = req.body;
        return Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: {
            amount: { assetCode: 'BTC', assetIssuer: BTC_ISSUER, amount },
            estimatedFee: {
              assetCode: 'XLM',
              amount: '0.5',
            },
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        });
      });

      const sdk = new LilySdk(
        { baseUrl: 'https://api.lily.test' },
        createMockHttpClient(requestSpy),
      );

      await sdk.payments.quote({
        fromWalletId: 'wallet_test',
        toAddress: 'addr_test',
        amount: {
          assetCode: 'BTC',
          assetIssuer: BTC_ISSUER,
          amount,
        },
      });

      expect(requestSpy).toHaveBeenCalledOnce();
      const body = capturedBody as { amount: { amount: string } };
      expect(body.amount.amount).toBe(amount);
    });

    it(`preserves amount "${amount}" unchanged in execute request`, async () => {
      let capturedBody: unknown;
      const requestSpy = vi.fn((req: HttpRequest) => {
        capturedBody = req.body;
        return Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: {
            id: 'pay_test',
            status: 'pending',
            amount: { assetCode: 'BTC', assetIssuer: BTC_ISSUER, amount },
            createdAt: new Date().toISOString(),
          },
        });
      });

      const sdk = new LilySdk(
        { baseUrl: 'https://api.lily.test' },
        createMockHttpClient(requestSpy),
      );

      await sdk.payments.execute({
        fromWalletId: 'wallet_test',
        toAddress: 'addr_test',
        amount: {
          assetCode: 'BTC',
          assetIssuer: BTC_ISSUER,
          amount,
        },
      });

      expect(requestSpy).toHaveBeenCalledOnce();
      const body = capturedBody as { amount: { amount: string } };
      expect(body.amount.amount).toBe(amount);
    });
  }
});
