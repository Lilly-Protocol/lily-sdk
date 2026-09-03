import { describe, it, expect } from 'vitest';
import { normalizeMoneyAmount } from '../src/models/common';
import type { MoneyAmount } from '../src/models/common';
import { validateMoneyAmount } from '../src/validation';

describe('MoneyAmount decimal normalization', () => {
  it('normalizes a whole-number amount to 2 decimal places', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '100' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('100.00');
  });

  it('normalizes a single-decimal amount to 2 decimal places', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '50.5' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('50.50');
  });

  it('preserves an already-normalized 2-decimal amount', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '25.00' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('25.00');
  });

  it('preserves decimal places up to 7 without truncation when scale is omitted', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '1.234567' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('1.234567');
  });

  it('preserves sub-cent 7-decimal stroop amounts without returning 0.00', () => {
    const input: MoneyAmount = { assetCode: 'XLM', amount: '0.0000001' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('0.0000001');
  });

  it('preserves sub-cent amounts such as 0.0000009 without silent precision loss', () => {
    const input: MoneyAmount = { assetCode: 'XLM', amount: '0.0000009' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('0.0000009');
  });

  it('truncates excess decimal places when an explicit scale is provided', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '1.234567' };
    const result = normalizeMoneyAmount(input, 2);
    expect(result.amount).toBe('1.23');
  });

  it('supports explicit scale and round options via options object', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '1.234567' };
    const truncated = normalizeMoneyAmount(input, { scale: 2 });
    expect(truncated.amount).toBe('1.23');

    const rounded = normalizeMoneyAmount(input, { scale: 2, round: true });
    expect(rounded.amount).toBe('1.23');
  });

  it('rounds half-up when rounding is explicitly requested', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '1.235' };
    const result = normalizeMoneyAmount(input, 2, { round: true });
    expect(result.amount).toBe('1.24');
  });

  it('rounds sub-cent amounts to target scale when requested', () => {
    const input: MoneyAmount = { assetCode: 'XLM', amount: '0.0000009' };
    const result = normalizeMoneyAmount(input, 6, { round: true });
    expect(result.amount).toBe('0.000001');
  });

  it('rounds amounts exceeding 7 decimal places to Stellar maximum precision', () => {
    const roundUp: MoneyAmount = { assetCode: 'XLM', amount: '0.00000019' };
    expect(normalizeMoneyAmount(roundUp).amount).toBe('0.0000002');

    const roundDown: MoneyAmount = { assetCode: 'XLM', amount: '0.00000012' };
    expect(normalizeMoneyAmount(roundDown).amount).toBe('0.0000001');
  });

  it('throws RangeError for invalid scale values', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '10.50' };
    expect(() => normalizeMoneyAmount(input, -1)).toThrow(RangeError);
    expect(() => normalizeMoneyAmount(input, 8)).toThrow(RangeError);
    expect(() => normalizeMoneyAmount(input, 2.5)).toThrow(RangeError);
  });

  it('produces output accepted by validateMoneyAmount', () => {
    const standard: MoneyAmount = { assetCode: 'USDC', amount: '0075.5' };
    expect(() => {
      validateMoneyAmount(normalizeMoneyAmount(standard), 'test');
    }).not.toThrow();

    const subCent: MoneyAmount = { assetCode: 'XLM', amount: '0.0000001' };
    expect(() => {
      validateMoneyAmount(normalizeMoneyAmount(subCent), 'test');
    }).not.toThrow();

    const rounded: MoneyAmount = { assetCode: 'XLM', amount: '0.0000009' };
    expect(() => {
      validateMoneyAmount(
        normalizeMoneyAmount(rounded, 6, { round: true }),
        'test',
      );
    }).not.toThrow();
  });

  it('handles amounts with leading zeros', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '0075.50' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('75.50');
  });

  it('preserves assetCode and assetIssuer', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: 'GA123...',
      amount: '10',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.assetCode).toBe('USDC');
    expect(result.assetIssuer).toBe('GA123...');
  });

  it('handles zero amount', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '0' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('0.00');
  });

  it('handles large amounts', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '1000000' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('1000000.00');
  });

  it('does not mutate the original input', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '42' };
    normalizeMoneyAmount(input);
    expect(input.amount).toBe('42');
  });
});
