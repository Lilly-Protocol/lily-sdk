import { encodePathSegment } from '../http/path';
import type {
  ExecutePaymentRequest,
  Payment,
  PaymentQuote,
  PaymentQuoteRequest,
} from '../models';
import type { PaymentClientContract } from '../types/contracts';
import { BaseClient } from './base-client';

export class PaymentClient extends BaseClient implements PaymentClientContract {
  public quote(input: PaymentQuoteRequest): Promise<PaymentQuote> {
    return this.request({
      method: 'POST',
      path: '/v1/payments/quote',
      body: input,
    });
  }

  public execute(input: ExecutePaymentRequest): Promise<Payment> {
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
}
