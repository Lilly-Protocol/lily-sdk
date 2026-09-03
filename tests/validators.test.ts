import { describe, it, expect } from 'vitest';
import { validateMoneyAmount, validateMemo } from '../src/models/validators';
import { LilyValidationError } from '../src/errors/sdk-error';

describe('validateMoneyAmount', () => {
  it('accepts valid integer amount', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: 'XLM', amount: '100' });
    }).not.toThrow();
  });

  it('accepts valid decimal amount with 7 digits', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: 'USDC', amount: '123.4567890' });
    }).not.toThrow();
  });

  it('rejects negative amount', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: 'XLM', amount: '-1' });
    }).toThrow(LilyValidationError);
  });

  it('rejects amount with more than 7 fractional digits', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: 'XLM', amount: '1.12345678' });
    }).toThrow(LilyValidationError);
  });

  it('rejects invalid asset code (too long)', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: 'TOOLONGASSET123', amount: '1' });
    }).toThrow(LilyValidationError);
  });

  it('rejects invalid asset code (special chars)', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: 'X-L-M', amount: '1' });
    }).toThrow(LilyValidationError);
  });

  it('rejects empty asset code', () => {
    expect(() => {
      validateMoneyAmount({ assetCode: '', amount: '1' });
    }).toThrow(LilyValidationError);
  });
});

describe('validateMemo', () => {
  it('accepts undefined memo', () => {
    expect(() => {
      validateMemo(undefined);
    }).not.toThrow();
  });

  it('accepts memo within byte limit', () => {
    expect(() => {
      validateMemo('hello');
    }).not.toThrow();
  });

  it('rejects memo exceeding 28 bytes', () => {
    const longMemo = 'a'.repeat(29);
    expect(() => {
      validateMemo(longMemo);
    }).toThrow(LilyValidationError);
  });

  it('accepts memo exactly at 28 bytes', () => {
    const exactMemo = 'a'.repeat(28);
    expect(() => {
      validateMemo(exactMemo);
    }).not.toThrow();
  });
});
