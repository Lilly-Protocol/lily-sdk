import { describe, it, expect } from 'vitest';

function validateMoneyAmount(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof value !== 'string') {
    errors.push('MoneyAmount must be a decimal string');
    return { valid: false, errors };
  }
  if (!/^\d+\.\d{2}$/.test(value)) {
    errors.push('MoneyAmount must have exactly 2 decimal places (e.g. "10.00")');
  }
  if (parseFloat(value) < 0) {
    errors.push('MoneyAmount must be non-negative');
  }
  return { valid: errors.length === 0, errors };
}

function validateMemo(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (value === undefined || value === null) return { valid: true, errors };
  if (typeof value !== 'string') {
    errors.push('memo must be a string');
    return { valid: false, errors };
  }
  if (value.length > 28) {
    errors.push('memo must be at most 28 characters (Stellar limit)');
  }
  if (!/^[\x20-\x7E]*$/.test(value)) {
    errors.push('memo must contain only printable ASCII characters');
  }
  return { valid: errors.length === 0, errors };
}

describe('MoneyAmount validation (issue #109)', () => {
  it('accepts valid decimal strings', () => {
    expect(validateMoneyAmount('10.00').valid).toBe(true);
    expect(validateMoneyAmount('0.99').valid).toBe(true);
    expect(validateMoneyAmount('1000000.00').valid).toBe(true);
  });

  it('rejects non-string values', () => {
    expect(validateMoneyAmount(10.00).valid).toBe(false);
    expect(validateMoneyAmount(null).valid).toBe(false);
    expect(validateMoneyAmount(undefined).valid).toBe(false);
  });

  it('rejects wrong decimal places', () => {
    expect(validateMoneyAmount('10').valid).toBe(false);
    expect(validateMoneyAmount('10.0').valid).toBe(false);
    expect(validateMoneyAmount('10.000').valid).toBe(false);
  });

  it('rejects negative amounts', () => {
    expect(validateMoneyAmount('-5.00').valid).toBe(false);
  });
});

describe('Memo validation (issue #109)', () => {
  it('accepts valid memos', () => {
    expect(validateMemo('Payment for services').valid).toBe(true);
    expect(validateMemo('INV-2024-001').valid).toBe(true);
    expect(validateMemo(undefined).valid).toBe(true);
    expect(validateMemo(null).valid).toBe(true);
  });

  it('rejects memos over 28 characters', () => {
    expect(validateMemo('a'.repeat(29)).valid).toBe(false);
    expect(validateMemo('a'.repeat(28)).valid).toBe(true);
  });

  it('rejects non-printable ASCII', () => {
    expect(validateMemo('hello\x01world').valid).toBe(false);
    expect(validateMemo('hello\u2603world').valid).toBe(false); // snowman unicode
  });

  it('rejects non-string types', () => {
    expect(validateMemo(12345).valid).toBe(false);
    expect(validateMemo({ text: 'hello' }).valid).toBe(false);
  });
});
