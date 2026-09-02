import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentClient } from '../src/clients/payment-client';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type { Payment, PaymentQuote, PaymentQuoteRequest, ExecutePaymentRequest } from '../src/models';

function createMockHttpClient(responseData: unknown = {}): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: responseData,
    } as HttpResponse),
  };
}

const mockPayment: Payment = {
  id: 'pay-1',
  fromWalletId: 'wallet-1',
  toAddress: 'GABC...',
  amount: { amount: '100', assetCode: 'XLM' },
  status: 'settled',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockQuote: PaymentQuote = {
  amount: { amount: '100', assetCode: 'XLM' },
  estimatedFee: { amount: '0.00001', assetCode: 'XLM' },
  expiresAt: '2024-01-01T01:00:00Z',
};

describe('PaymentClient', () => {
  let httpClient: HttpClient;
  let client: PaymentClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    client = new PaymentClient(httpClient);
  });

  describe('quote', () => {
    it('sends POST /v1/payments/quote with the input body and returns the quote', async () => {
      const input: PaymentQuoteRequest = {
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { amount: '100', assetCode: 'XLM' },
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockQuote,
      } as HttpResponse);

      const result = await client.quote(input);

      expect(result).toEqual(mockQuote);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/payments/quote',
        body: input,
      });
    });
  });

  describe('execute', () => {
    it('sends POST /v1/payments with the input body and returns the payment', async () => {
      const input: ExecutePaymentRequest = {
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { amount: '100', assetCode: 'XLM' },
        memo: 'test-payment',
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 201,
        headers: new Headers(),
        data: mockPayment,
      } as HttpResponse);

      const result = await client.execute(input);

      expect(result.id).toBe('pay-1');
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/payments',
        body: input,
      });
    });
  });

  describe('get', () => {
    it('sends GET /v1/payments/:id and returns the payment', async () => {
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockPayment,
      } as HttpResponse);

      const result = await client.get('pay-1');

      expect(result).toEqual(mockPayment);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/payments/pay-1',
      });
    });
  });
});
