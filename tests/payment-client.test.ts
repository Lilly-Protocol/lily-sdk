import { describe, expect, it } from 'vitest';
import type { HttpRequest } from '../src/http/types';
import type {
  ExecutePaymentRequest,
  Payment,
  PaymentQuote,
  PaymentQuoteRequest,
} from '../src/models';
import { PaymentClient } from '../src/clients/payment-client';
import { createMockHttpClient } from './helpers/mock-http-client';

const stubPayment: Payment = {
  id: 'pay-1',
  fromWalletId: 'wallet-1',
  toAddress: 'GABC123',
  amount: { assetCode: 'XLM', amount: '50' },
  status: 'queued',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const stubQuote: PaymentQuote = {
  amount: { assetCode: 'XLM', amount: '50' },
  estimatedFee: { assetCode: 'XLM', amount: '0.00001' },
  expiresAt: '2024-01-01T01:00:00Z',
};

describe('PaymentClient', () => {
  it('quote sends POST /v1/payments/quote with body and returns quote', async () => {
    let captured: HttpRequest<PaymentQuoteRequest> | undefined;
    const input: PaymentQuoteRequest = {
      fromWalletId: 'wallet-1',
      toAddress: 'GABC123',
      amount: { assetCode: 'XLM', amount: '50' },
    };

    const client = new PaymentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<PaymentQuoteRequest>;
        return { status: 200, data: stubQuote };
      }),
    );

    const result = await client.quote(input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('POST');
    expect(captured!.path).toBe('/v1/payments/quote');
    expect(captured!.body).toEqual(input);
    expect(result).toEqual(stubQuote);
  });

  it('execute sends POST /v1/payments with body including idempotencyKey', async () => {
    let captured: HttpRequest<ExecutePaymentRequest> | undefined;
    const input: ExecutePaymentRequest = {
      fromWalletId: 'wallet-1',
      toAddress: 'GABC123',
      amount: { assetCode: 'XLM', amount: '50' },
      memo: 'test payment',
      idempotencyKey: 'key-abc',
    };

    const client = new PaymentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<ExecutePaymentRequest>;
        return { status: 200, data: stubPayment };
      }),
    );

    const result = await client.execute(input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('POST');
    expect(captured!.path).toBe('/v1/payments');
    expect(captured!.body).toEqual(input);
    expect(result).toEqual(stubPayment);
  });

  it('get sends GET /v1/payments/:id and returns payment', async () => {
    let captured: HttpRequest<undefined> | undefined;
    const client = new PaymentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<undefined>;
        return { status: 200, data: stubPayment };
      }),
    );

    const result = await client.get('pay-1');

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('GET');
    expect(captured!.path).toBe('/v1/payments/pay-1');
    expect(result).toEqual(stubPayment);
  });
});
