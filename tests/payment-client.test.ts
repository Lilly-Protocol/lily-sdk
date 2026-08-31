import { describe, it, expect } from 'vitest';
import { PaymentClient } from '../src/clients/payment-client';
import { createMockHttpClient } from './helpers/mock-http-client';
import type { HttpRequest } from '../src/http/types';

describe('PaymentClient', () => {
  it('quote posts to /v1/payments/quote with correct body', async () => {
    let captured: HttpRequest | undefined;
    const client = new PaymentClient(
      createMockHttpClient((req) => {
        captured = req;
        return Promise.resolve({
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          data: {
            amount: { assetCode: 'USD', amount: '100' },
            estimatedFee: { assetCode: 'USD', amount: '1' },
            expiresAt: '2026-09-01T00:00:00Z',
          },
        });
      }),
    );

    await client.quote({
      fromWalletId: 'w1',
      toAddress: 'addr1',
      amount: { assetCode: 'USD', amount: '100' },
    });

    expect(captured?.method).toBe('POST');
    expect(captured?.path).toBe('/v1/payments/quote');
    expect(captured?.body).toEqual({
      fromWalletId: 'w1',
      toAddress: 'addr1',
      amount: { assetCode: 'USD', amount: '100' },
    });
  });

  it('execute posts to /v1/payments with idempotencyKey', async () => {
    let captured: HttpRequest | undefined;
    const client = new PaymentClient(
      createMockHttpClient((req) => {
        captured = req;
        return Promise.resolve({
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          data: {
            id: 'p1',
            fromWalletId: 'w1',
            toAddress: 'addr1',
            amount: { assetCode: 'USD', amount: '100' },
            status: 'queued',
            createdAt: '2026-08-31T00:00:00Z',
            updatedAt: '2026-08-31T00:00:00Z',
          },
        });
      }),
    );

    await client.execute({
      fromWalletId: 'w1',
      toAddress: 'addr1',
      amount: { assetCode: 'USD', amount: '100' },
      idempotencyKey: 'key-1',
    });

    expect(captured?.method).toBe('POST');
    expect(captured?.path).toBe('/v1/payments');
    expect(captured?.body).toEqual({
      fromWalletId: 'w1',
      toAddress: 'addr1',
      amount: { assetCode: 'USD', amount: '100' },
      idempotencyKey: 'key-1',
    });
  });

  it('get reads /v1/payments/:id', async () => {
    let captured: HttpRequest | undefined;
    const client = new PaymentClient(
      createMockHttpClient((req) => {
        captured = req;
        return Promise.resolve({
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          data: {
            id: 'p1',
            fromWalletId: 'w1',
            toAddress: 'addr1',
            amount: { assetCode: 'USD', amount: '100' },
            status: 'settled',
            createdAt: '2026-08-31T00:00:00Z',
            updatedAt: '2026-08-31T00:00:00Z',
          },
        });
      }),
    );

    await client.get('p1');

    expect(captured?.method).toBe('GET');
    expect(captured?.path).toBe('/v1/payments/p1');
  });
});
