import { describe, it, expect } from 'vitest';
import { normalizeMoneyAmount } from '../src/models/common';
import { MoneyAmount } from '../src/models/common';

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

  it('truncates excess decimal places to 2', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '1.234567' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('1.23');
  });

  it('handles amounts with leading zeros', () => {
    const input: MoneyAmount = { assetCode: 'USDC', amount: '0075.50' };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('75.50');
  });

  it('preserves assetCode and assetIssuer', () => {
    const input: MoneyAmount = { assetCode: 'USDC', assetIssuer: 'GA123...', amount: '10' };
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
