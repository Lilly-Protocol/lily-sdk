import { describe, expect, it } from 'vitest';
import { LilyValidationError } from '../src/errors/sdk-error';
import {
  validateExecutePaymentRequest,
  validateMemo,
  validateMoneyAmount,
  validateNonEmptyString,
  validateResolveIdentityRequest,
} from '../src/validation';

describe('LilyValidationError export surface', () => {
  it('is constructible and instanceof works', () => {
    const error = new LilyValidationError('test message', {
      code: 'VALIDATION',
    });
    expect(error).toBeInstanceOf(LilyValidationError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('LilyValidationError');
    expect(error.message).toBe('test message');
    expect(error.code).toBe('VALIDATION');
  });

  it('is thrown by validateNonEmptyString on invalid input', () => {
    expect(() => validateNonEmptyString('', 'field')).toThrow(
      LilyValidationError,
    );
  });

  it('is thrown by validateMoneyAmount on invalid amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: '', amount: '10' }, 'test'),
    ).toThrow(LilyValidationError);
  });

  it('is thrown by validateMemo on over-long text', () => {
    expect(() => validateMemo('x'.repeat(29), 'test')).toThrow(
      LilyValidationError,
    );
  });

  it('is thrown by validateResolveIdentityRequest with no keys', () => {
    expect(() => validateResolveIdentityRequest({})).toThrow(
      LilyValidationError,
    );
  });

  it('is thrown by validateExecutePaymentRequest on invalid input', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: '',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10' },
      }),
    ).toThrow(LilyValidationError);
  });
});
