import { describe, expect, it } from 'vitest';
import { LilyValidationError } from '../src/errors/sdk-error';
import {
  validateExecutePaymentRequest,
  validateMemo,
  validateMoneyAmount,
} from '../src/validation';

describe('validateMoneyAmount Stellar constraints', () => {
  it('accepts amount with exactly 7 fractional digits', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '10.1234567' }, 'test'),
    ).not.toThrow();
  });

  it('rejects amount with 8 fractional digits', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '10.12345678' }, 'test'),
    ).toThrow(/at most 7 fractional digits/);
  });

  it('accepts zero amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'XLM', amount: '0' }, 'test'),
    ).not.toThrow();
  });

  it('accepts integer amount without decimals', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'XLM', amount: '100' }, 'test'),
    ).not.toThrow();
  });

  it('rejects negative amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '-5' }, 'test'),
    ).toThrow(/non-negative decimal/);
  });

  it('rejects scientific notation', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '1e3' }, 'test'),
    ).toThrow(/non-negative decimal/);
  });
});

describe('validateMemo Stellar constraints', () => {
  it('accepts memo within 28 byte limit', () => {
    expect(() => validateMemo('short memo', 'test')).not.toThrow();
  });

  it('accepts exactly 28 character text memo', () => {
    expect(() => validateMemo('a'.repeat(28), 'test')).not.toThrow();
  });

  it('rejects text memo exceeding 28 bytes', () => {
    expect(() => validateMemo('a'.repeat(29), 'test')).toThrow(
      /at most 28 bytes/,
    );
  });

  it('accepts hex memo within 64 character limit', () => {
    expect(() => validateMemo('ab'.repeat(32), 'test')).not.toThrow();
  });

  it('rejects hex memo exceeding 64 characters', () => {
    expect(() => validateMemo('ab'.repeat(33), 'test')).toThrow(
      /at most 64 characters/,
    );
  });

  it('accepts undefined memo', () => {
    expect(() => validateMemo(undefined, 'test')).not.toThrow();
  });

  it('rejects non-string memo', () => {
    expect(() => validateMemo(123 as any, 'test')).toThrow(/must be a string/);
  });
});

describe('validateExecutePaymentRequest with memo and MoneyAmount', () => {
  it('accepts valid payment request with memo', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10.50' },
        memo: 'payment ref',
      }),
    ).not.toThrow();
  });

  it('rejects payment with over-long memo', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10.50' },
        memo: 'x'.repeat(29),
      }),
    ).toThrow(/memo/);
  });

  it('rejects payment with invalid MoneyAmount fractionals', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10.12345678' },
      }),
    ).toThrow(/fractional digits/);
  });
});
