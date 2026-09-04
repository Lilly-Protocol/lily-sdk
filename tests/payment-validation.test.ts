import { describe, expect, it } from 'vitest';
import {
  validateExecutePaymentRequest,
  validateMemo,
  validateMoneyAmount,
} from '../src/validation';

const TEST_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('validateMoneyAmount Stellar constraints', () => {
  it('accepts amount with exactly 7 fractional digits', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '10.1234567' }, 'test'),
    ).not.toThrow();
  });

  it('rejects amount with 8 fractional digits', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '10.12345678' }, 'test'),
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
      validateMoneyAmount({ assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '-5' }, 'test'),
    ).toThrow(/non-negative decimal/);
  });

  it('rejects scientific notation', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '1e3' }, 'test'),
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
        amount: { assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '10.50' },
        memo: 'payment ref',
      }),
    ).not.toThrow();
  });

  it('rejects payment with over-long memo', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '10.50' },
        memo: 'x'.repeat(29),
      }),
    ).toThrow(/memo/);
  });

  it('rejects payment with invalid MoneyAmount fractionals', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', assetIssuer: TEST_ISSUER, amount: '10.12345678' },
      }),
    ).toThrow(/fractional digits/);
  });
});

describe('validateMoneyAmount native-XLM / issued-asset issuer rules (issue #438)', () => {
  const ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

  it('rejects the native asset XLM carrying an assetIssuer', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'XLM', assetIssuer: ISSUER, amount: '1.0' }, 'test'),
    ).toThrow(/assetIssuer.*omitted for the native asset \(XLM/);
  });

  it('rejects an issued asset missing its assetIssuer', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '1.0' }, 'test'),
    ).toThrow(/assetIssuer.*required for issued assets/);
  });

  it('accepts the native asset XLM without an assetIssuer', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'XLM', amount: '1.0' }, 'test'),
    ).not.toThrow();
  });

  it('accepts an issued asset with a 56-character G-address issuer', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', assetIssuer: ISSUER, amount: '1.0' }, 'test'),
    ).not.toThrow();
  });

  it('treats asset codes case-sensitively: lowercase xlm is an issued asset', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'xlm', assetIssuer: ISSUER, amount: '1.0' }, 'test'),
    ).not.toThrow();
    expect(() =>
      validateMoneyAmount({ assetCode: 'xlm', amount: '1.0' }, 'test'),
    ).toThrow(/assetIssuer.*required for issued assets/);
  });
});
