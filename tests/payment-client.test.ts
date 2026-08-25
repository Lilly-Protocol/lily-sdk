import { describe, expect, it, vi } from 'vitest';

import { PaymentClient } from '../src/clients/payment-client';
import type { Payment, PaymentQuote } from '../src/models/payment';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('PaymentClient', () => {
  it('posts the complete quote request to the payment quote endpoint', async () => {
    const quoteRequest = {
      fromWalletId: 'wallet_123',
      toAddress: 'GDESTINATION',
      amount: {
        amount: '25.50',
        assetCode: 'USDC',
      },
    };
    const quote: PaymentQuote = {
      amount: quoteRequest.amount,
      estimatedFee: {
        amount: '0.01',
        assetCode: 'USDC',
      },
      expiresAt: '2025-06-01T12:00:00.000Z',
    };
    const requestSpy = vi.fn(() =>
      Promise.resolve({ status: 200, headers: new Headers(), data: quote }),
    );
    const client = new PaymentClient(createMockHttpClient(requestSpy));

    const result = await client.quote(quoteRequest);

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/payments/quote',
      body: {
        fromWalletId: 'wallet_123',
        toAddress: 'GDESTINATION',
        amount: {
          amount: '25.50',
          assetCode: 'USDC',
        },
      },
    });
    expect(result).toBe(quote);
  });

  it('posts the complete execution request with its idempotency key', async () => {
    const executeRequest = {
      fromWalletId: 'wallet_123',
      toAddress: 'GDESTINATION',
      amount: {
        amount: '25.50',
        assetCode: 'USDC',
      },
      memo: 'invoice-42',
      idempotencyKey: 'payment-attempt-123',
    };
    const payment: Payment = {
      id: 'payment_123',
      ...executeRequest,
      status: 'queued',
      createdAt: '2025-06-01T12:00:00.000Z',
      updatedAt: '2025-06-01T12:00:00.000Z',
    };
    const requestSpy = vi.fn(() =>
      Promise.resolve({ status: 200, headers: new Headers(), data: payment }),
    );
    const client = new PaymentClient(createMockHttpClient(requestSpy));

    const result = await client.execute(executeRequest);

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/payments',
      body: {
        fromWalletId: 'wallet_123',
        toAddress: 'GDESTINATION',
        amount: {
          amount: '25.50',
          assetCode: 'USDC',
        },
        memo: 'invoice-42',
        idempotencyKey: 'payment-attempt-123',
      },
    });
    expect(result).toBe(payment);
  });

  it('gets a payment by id from the payment endpoint', async () => {
    const payment: Payment = {
      id: 'payment_123',
      fromWalletId: 'wallet_123',
      toAddress: 'GDESTINATION',
      amount: {
        amount: '25.50',
        assetCode: 'USDC',
      },
      status: 'settled',
      createdAt: '2025-06-01T12:00:00.000Z',
      updatedAt: '2025-06-01T12:01:00.000Z',
    };
    const requestSpy = vi.fn(() =>
      Promise.resolve({ status: 200, headers: new Headers(), data: payment }),
    );
    const client = new PaymentClient(createMockHttpClient(requestSpy));

    const result = await client.get('payment_123');

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/payments/payment_123',
    });
    expect(result).toBe(payment);
  });
});
