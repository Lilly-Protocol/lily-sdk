import { describe, expect, it, vi } from 'vitest';

import type { Payment, PaymentQuote } from '../src/models';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('PaymentClient', () => {
  // ─── quote ─────────────────────────────────────────────
  it('quote sends POST /v1/payments/quote with PaymentQuoteRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          quoteId: 'quote-001',
          sourceAsset: { assetCode: 'USDC', amount: '100.00' },
          destinationAsset: { assetCode: 'XLM', amount: '500' },
          fee: { assetCode: 'USDC', amount: '0.10' },
          expiresAt: '2026-01-01T00:00:00Z',
        } satisfies PaymentQuote,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = {
      sourceWalletId: 'wallet-001',
      destinationAddress: 'GXYZ123',
      amount: { assetCode: 'USDC', amount: '100.00' },
    };

    const result = await sdk.payments.quote(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/payments/quote',
      body: input,
    });
    expect(result.quoteId).toBe('quote-001');
    expect(result.sourceAsset.amount).toBe('100.00');
    expect(result.destinationAsset.assetCode).toBe('XLM');
    expect(result.fee.amount).toBe('0.10');
  });

  it('quote return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      quoteId: 'q-pt',
      sourceAsset: { assetCode: 'EURC', amount: '50' },
      destinationAsset: { assetCode: 'USDC', amount: '54' },
      fee: { assetCode: 'EURC', amount: '0.25' },
      expiresAt: '2026-07-01T12:00:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.payments.quote({
      sourceWalletId: 'w-1',
      destinationAddress: 'addr',
      amount: { assetCode: 'EURC', amount: '50' },
    });

    expect(result).toEqual(mockData);
  });

  // ─── execute ──────────────────────────────────────────
  it('execute sends POST /v1/payments with ExecutePaymentRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: {
          id: 'payment-001',
          sourceWalletId: 'wallet-001',
          destinationAddress: 'GXYZ123',
          amount: { assetCode: 'USDC', amount: '100.00' },
          fee: { assetCode: 'USDC', amount: '0.10' },
          status: 'pending',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } satisfies Payment,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = {
      quoteId: 'quote-001',
      sourceWalletId: 'wallet-001',
    };

    const result = await sdk.payments.execute(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/payments',
      body: input,
    });
    expect(result.id).toBe('payment-001');
    expect(result.status).toBe('pending');
    expect(result.sourceWalletId).toBe('wallet-001');
  });

  it('execute return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'p-pt',
      sourceWalletId: 'w-src',
      destinationAddress: 'GDEST',
      amount: { assetCode: 'XLM', amount: '1000' },
      fee: { assetCode: 'XLM', amount: '1' },
      status: 'completed',
      createdAt: '2026-06-15T08:00:00Z',
      updatedAt: '2026-06-15T08:05:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.payments.execute({
      quoteId: 'q-1',
      sourceWalletId: 'w-src',
    });

    expect(result).toEqual(mockData);
  });

  // ─── get ───────────────────────────────────────────────
  it('get sends GET /v1/payments/:paymentId', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'payment-002',
          sourceWalletId: 'wallet-002',
          destinationAddress: 'GABC456',
          amount: { assetCode: 'USDC', amount: '250.00' },
          fee: { assetCode: 'USDC', amount: '0.25' },
          status: 'completed',
          createdAt: '2026-01-02T00:00:00Z',
          updatedAt: '2026-01-02T00:05:00Z',
        } satisfies Payment,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.payments.get('payment-002');

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/payments/payment-002',
    });
    expect(result.id).toBe('payment-002');
    expect(result.status).toBe('completed');
    expect(result.amount.amount).toBe('250.00');
  });

  it('get passes payment ID into the URL path', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'p-1',
          sourceWalletId: 'w-1',
          destinationAddress: 'addr',
          amount: { assetCode: 'XLM', amount: '10' },
          fee: { assetCode: 'XLM', amount: '0.01' },
          status: 'pending',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.payments.get('p-1');

    const call = requestSpy.mock.calls[0][0];
    expect(call.method).toBe('GET');
    expect(call.path).toBe('/v1/payments/p-1');
  });

  it('get return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'p-pt2',
      sourceWalletId: 'w-src2',
      destinationAddress: 'GDEST2',
      amount: { assetCode: 'USDC', amount: '999.99' },
      fee: { assetCode: 'USDC', amount: '1.00' },
      status: 'failed',
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:10:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.payments.get('p-pt2');

    expect(result).toEqual(mockData);
  });
});
