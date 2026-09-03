import type { AuditMetadata, MoneyAmount } from './common';

export type PaymentStatus =
  | 'queued'
  | 'processing'
  | 'submitted'
  | 'settled'
  | 'failed';

export interface Payment extends AuditMetadata {
  id: string;
  fromWalletId: string;
  toAddress: string;
  amount: MoneyAmount;
  memo?: string;
  status: PaymentStatus;
  transactionHash?: string;
}

export interface PaymentQuoteRequest {
  fromWalletId: string;
  toAddress: string;
  amount: MoneyAmount;
}

export interface PaymentQuote {
  amount: MoneyAmount;
  estimatedFee: MoneyAmount;
  expiresAt: string;
}

export interface ExecutePaymentRequest {
  fromWalletId: string;
  toAddress: string;
  amount: MoneyAmount;
  memo?: string;
  idempotencyKey?: string;
}
