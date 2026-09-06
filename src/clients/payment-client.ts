import { encodePathSegment } from '../http/path';
import { validateNonEmptyString } from '../validation';
import type {
  ExecutePaymentRequest,
  Payment,
  PaymentQuote,
  PaymentQuoteRequest,
} from '../models';
import type { PaymentClientContract } from '../types/contracts';
import {
  validateExecutePaymentRequest,
  validatePaymentQuoteRequest,
} from '../validation';
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
    validateNonEmptyString(paymentId, 'paymentId');
    return this.request({
      method: 'GET',
      path: `/v1/payments/${encodePathSegment(paymentId)}`,
    });
  }

  public async list(query?: {
    limit?: number;
    cursor?: string;
  }): Promise<readonly Payment[]> {
    return this.request({
      method: 'GET',
      path: '/v1/payments',
      query: query ?? {},
    });
  }
}
