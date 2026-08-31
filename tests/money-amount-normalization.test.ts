import { describe, expect, it, vi } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { ExecutePaymentRequest } from '../src/models/payment';

describe('MoneyAmount decimal normalization passthrough', () => {
  const baseConfig = {
    baseUrl: 'https://api.lily.test',
    apiKey: 'test-key',
    timeoutMs: 2_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
  };

  const cases: { label: string; amount: string }[] = [
    { label: 'integer string', amount: '1' },
    { label: 'single decimal zero', amount: '1.0' },
    { label: 'leading zero', amount: '01.5' },
    { label: 'micro amount', amount: '0.000001' },
  ];

  for (const { label, amount } of cases) {
    it(`passes ${label} "${amount}" unchanged in execute payment body`, async () => {
      let capturedBody: unknown = null;
      const fetchSpy = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.body != null) {
          capturedBody = JSON.parse(init.body as string);
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'pay-1',
              status: 'queued',
              fromWalletId: 'w-1',
              toAddress: 'addr-1',
              amount: { assetCode: 'USD', amount },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
        );
      });

      const config = resolveLilySdkConfig({ ...baseConfig, fetch: fetchSpy });
      const client = createFetchHttpClient(config);

      const payload: ExecutePaymentRequest = {
        fromWalletId: 'w-1',
        toAddress: 'addr-1',
        amount: { assetCode: 'USD', amount },
      };

      await client.request({
        method: 'POST',
        path: '/v1/payments/execute',
        body: payload,
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(capturedBody).not.toBeNull();
      const body = capturedBody as ExecutePaymentRequest;
      expect(body.amount.amount).toBe(amount);
    });
  }
});
