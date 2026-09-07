import { describe, expect, it } from 'vitest';

import { LilyValidationError } from '../src/errors/sdk-error';
import {
  validateExecutePaymentRequest,
  validateMoneyAmount,
  validateNonEmptyString,
  validatePaymentQuoteRequest,
  validateResolveIdentityRequest,
} from '../src/validation';

describe('validateNonEmptyString', () => {
  it('accepts non-empty strings', () => {
    expect(() => validateNonEmptyString('abc', 'field')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validateNonEmptyString('', 'field')).toThrow(
      LilyValidationError,
    );
  });

  it('rejects whitespace-only string', () => {
    expect(() => validateNonEmptyString('   ', 'field')).toThrow(
      LilyValidationError,
    );
  });

  it('rejects non-string values', () => {
    expect(() => validateNonEmptyString(123 as any, 'field')).toThrow(
      LilyValidationError,
    );
    expect(() => validateNonEmptyString(undefined as any, 'field')).toThrow(
      LilyValidationError,
    );
  });
});

describe('validateMoneyAmount', () => {
  it('accepts valid MoneyAmount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '10.50' }, 'test'),
    ).not.toThrow();
  });

  it('accepts integer amount string', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'XLM', amount: '100' }, 'test'),
    ).not.toThrow();
  });

  it('rejects invalid asset code', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: '', amount: '10' }, 'test'),
    ).toThrow(/assetCode/);
  });

  it('rejects asset code longer than 12 chars', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'ABCDEFGHIJKLM', amount: '10' }, 'test'),
    ).toThrow(/assetCode/);
  });

  it('rejects negative amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '-5' }, 'test'),
    ).toThrow(/amount/);
  });

  it('rejects scientific notation amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '1e3' }, 'test'),
    ).toThrow(/amount/);
  });

  it('rejects missing amount object', () => {
    expect(() => validateMoneyAmount(null as any, 'test')).toThrow(
      LilyValidationError,
    );
  });
});

describe('validateResolveIdentityRequest', () => {
  it('accepts exactly one resolver key', () => {
    expect(() =>
      validateResolveIdentityRequest({ agentId: 'agent-1' }),
    ).not.toThrow();
    expect(() =>
      validateResolveIdentityRequest({ stellarAddress: 'alice*example.com' }),
    ).not.toThrow();
    expect(() =>
      validateResolveIdentityRequest({ domain: 'example.com' }),
    ).not.toThrow();
  });

  it('rejects zero resolver keys', () => {
    expect(() => validateResolveIdentityRequest({})).toThrow(/exactly one/);
  });

  it('rejects multiple resolver keys', () => {
    expect(() =>
      validateResolveIdentityRequest({ agentId: 'a', stellarAddress: 'b' }),
    ).toThrow(/only one/);
  });

  it('rejects empty string resolver value', () => {
    expect(() => validateResolveIdentityRequest({ agentId: '' })).toThrow(
      /non-empty/,
    );
  });
});

describe('validateExecutePaymentRequest', () => {
  it('accepts valid request', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10.00' },
      }),
    ).not.toThrow();
  });

  it('rejects empty fromWalletId', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: '',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10' },
      }),
    ).toThrow(/fromWalletId/);
  });
});

describe('validatePaymentQuoteRequest', () => {
  it('accepts valid request', () => {
    expect(() =>
      validatePaymentQuoteRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'XLM', amount: '50' },
      }),
    ).not.toThrow();
  });

  it('rejects invalid amount format', () => {
    expect(() =>
      validatePaymentQuoteRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'XLM', amount: 'abc' },
      }),
    ).toThrow(/amount/);
  });
});
