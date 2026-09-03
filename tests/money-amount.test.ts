import { describe, it, expect } from 'vitest';
import { normalizeMoneyAmount } from '../src/models/common';
import type { MoneyAmount } from '../src/models/common';

const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('MoneyAmount decimal normalization', () => {
  it('normalizes a whole-number amount to 2 decimal places', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '100',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('100.00');
  });

  it('normalizes a single-decimal amount to 2 decimal places', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '50.5',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('50.50');
  });

  it('preserves an already-normalized 2-decimal amount', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '25.00',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('25.00');
  });

  it('truncates excess decimal places to 2', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '1.234567',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('1.23');
  });

  it('handles amounts with leading zeros', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '0075.50',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('75.50');
  });

  it('preserves assetCode and assetIssuer', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '10',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.assetCode).toBe('USDC');
    expect(result.assetIssuer).toBe(USDC_ISSUER);
  });

  it('handles zero amount', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '0',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('0.00');
  });

  it('handles large amounts', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '1000000',
    };
    const result = normalizeMoneyAmount(input);
    expect(result.amount).toBe('1000000.00');
  });

  it('does not mutate the original input', () => {
    const input: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: USDC_ISSUER,
      amount: '42',
    };
    normalizeMoneyAmount(input);
    expect(input.amount).toBe('42');
  });
});
