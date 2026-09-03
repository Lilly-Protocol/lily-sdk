import { encodePathSegment } from '../http/path';
import type {
  ExecutePaymentRequest,
  PaginationQuery,
  Payment,
  PaymentQuote,
  PaymentQuoteRequest,
} from '../models';
import type { PaymentClientContract } from '../types/contracts';
import {
  validateExecutePaymentRequest,
  validatePaymentQuoteRequest,
} from '../validation/payment';
import { BaseClient } from './base-client';

export class PaymentClient extends BaseClient implements PaymentClientContract {
  public async quote(input: PaymentQuoteRequest): Promise<PaymentQuote> {
    validatePaymentQuoteRequest(input);
    return this.request({
      method: 'POST',
      path: '/v1/payments/quote',
      body: input,
    });
  }

  public async execute(input: ExecutePaymentRequest): Promise<Payment> {
    validateExecutePaymentRequest(input);
    return this.request({
      method: 'POST',
      path: '/v1/payments',
      body: input,
    });
  }

  public get(paymentId: string): Promise<Payment> {
    return this.request({
      method: 'GET',
      path: `/v1/payments/${encodePathSegment(paymentId)}`,
    });
  }

  public list(query: PaginationQuery = {}): Promise<readonly Payment[]> {
    return this.request({
      method: 'GET',
      path: '/v1/payments',
      query: {
        ...query,
      },
    });
  }
}
