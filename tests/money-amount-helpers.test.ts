import { describe, expect, it } from 'vitest';

import {
  toAmountString,
  toMoneyAmount,
  MAX_STELLAR_SCALE,
  normalizeMoneyAmount,
} from '../src/models/common';
import * as ModelsExports from '../src/models';
import * as RootExports from '../src/index';

describe('toAmountString', () => {
  describe('floating-point artifact elimination', () => {
    it('yields exact decimal string "0.3" for 0.1 + 0.2 without float artifacts', () => {
      const floatAddition = 0.1 + 0.2;
      // In vanilla JS, this is 0.30000000000000004
      expect(floatAddition.toString()).toBe('0.30000000000000004');

      const result = toAmountString(floatAddition);
      expect(result).toBe('0.3');
    });

    it('handles other classic float inaccuracies (0.2 + 0.4, 0.7 + 0.1)', () => {
      expect(toAmountString(0.2 + 0.4)).toBe('0.6');
      expect(toAmountString(0.7 + 0.1)).toBe('0.8');
      expect(toAmountString(1.14 - 1.1)).toBe('0.04');
    });
  });

  describe('custom scale formatting and rounding', () => {
    it('formats with fixed decimal width when scale is specified', () => {
      expect(toAmountString(0.1 + 0.2, 2)).toBe('0.30');
      expect(toAmountString(0.1 + 0.2, 4)).toBe('0.3000');
      expect(toAmountString(0.1 + 0.2, 7)).toBe('0.3000000');
      expect(toAmountString(10, 2)).toBe('10.00');
      expect(toAmountString(10, 0)).toBe('10');
    });

    it('rounds half-up when number exceeds the specified scale', () => {
      expect(toAmountString(12.3456, 2)).toBe('12.35');
      expect(toAmountString(12.3444, 2)).toBe('12.34');
      expect(toAmountString(12.345, 2)).toBe('12.35');
      expect(toAmountString(12.3456, 0)).toBe('12');
    });
  });

  describe('>7 fractional-digit rounding policy (Stellar stroop boundary)', () => {
    it('rounds numbers beyond Stellar 7-decimal scale when scale is omitted', () => {
      // 8 fractional digits: 0.12345678 -> rounds to 7 digits
      expect(toAmountString(0.12345678)).toBe('0.1234568');
      expect(toAmountString(0.12345674)).toBe('0.1234567');
      expect(toAmountString(0.00000009)).toBe('0.0000001');
      expect(toAmountString(0.00000004)).toBe('0');
    });

    it('preserves exact 7-decimal places (1 stroop = 0.0000001)', () => {
      expect(toAmountString(0.0000001)).toBe('0.0000001');
      expect(toAmountString(10.0000001)).toBe('10.0000001');
    });

    it('supports custom scale > 7 when explicitly requested', () => {
      expect(toAmountString(0.123456789123, 10)).toBe('0.1234567891');
    });
  });

  describe('zero and negative values', () => {
    it('handles zero and negative zero correctly', () => {
      expect(toAmountString(0)).toBe('0');
      expect(toAmountString(-0)).toBe('0');
      expect(toAmountString(0, 2)).toBe('0.00');
      expect(toAmountString(-0, 2)).toBe('0.00');
    });

    it('handles negative numbers correctly', () => {
      expect(toAmountString(-15.75)).toBe('-15.75');
      expect(toAmountString(-15.75, 1)).toBe('-15.8');
      expect(toAmountString(-0.1 - 0.2)).toBe('-0.3');
    });
  });

  describe('exponential / scientific notation expansion', () => {
    it('expands scientific notation into clean base-10 strings', () => {
      expect(toAmountString(1e-5)).toBe('0.00001');
      expect(toAmountString(1e-6)).toBe('0.000001');
      expect(toAmountString(1e-7)).toBe('0.0000001');
      expect(toAmountString(2.5e-3)).toBe('0.0025');
    });
  });

  describe('large integers and safe integer boundary', () => {
    it('handles large integers accurately up to MAX_SAFE_INTEGER', () => {
      expect(toAmountString(1_000_000)).toBe('1000000');
      expect(toAmountString(1_000_000_000)).toBe('1000000000');
      expect(toAmountString(Number.MAX_SAFE_INTEGER)).toBe('9007199254740991');
      expect(toAmountString(Number.MAX_SAFE_INTEGER, 2)).toBe(
        '9007199254740991.00',
      );
    });
  });

  describe('validation and error handling', () => {
    it('throws RangeError for non-finite values', () => {
      expect(() => toAmountString(NaN)).toThrow(RangeError);
      expect(() => toAmountString(Infinity)).toThrow(RangeError);
      expect(() => toAmountString(-Infinity)).toThrow(RangeError);
      // @ts-expect-error - testing invalid runtime input
      expect(() => toAmountString('100')).toThrow(RangeError);
    });

    it('throws RangeError for invalid scale parameters', () => {
      expect(() => toAmountString(10, -1)).toThrow(RangeError);
      expect(() => toAmountString(10, 1.5)).toThrow(RangeError);
      expect(() => toAmountString(10, 19)).toThrow(RangeError);
      // @ts-expect-error - testing invalid runtime scale
      expect(() => toAmountString(10, '2')).toThrow(RangeError);
    });
  });
});

describe('toMoneyAmount', () => {
  it('builds MoneyAmount using positional arguments with number amount', () => {
    const amount = toMoneyAmount(0.1 + 0.2, 'XLM');
    expect(amount).toEqual({
      assetCode: 'XLM',
      amount: '0.3',
    });
  });

  it('builds MoneyAmount using positional arguments with scale and issuer', () => {
    const amount = toMoneyAmount(
      100.5,
      'USDC',
      'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      2,
    );
    expect(amount).toEqual({
      assetCode: 'USDC',
      assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '100.50',
    });
  });

  it('builds MoneyAmount using options bag', () => {
    const amount = toMoneyAmount({
      amount: 1e-5,
      assetCode: 'EURC',
      assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    });
    expect(amount).toEqual({
      assetCode: 'EURC',
      assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '0.00001',
    });
  });

  it('accepts existing valid decimal string amounts', () => {
    const amount = toMoneyAmount({
      amount: '50.25',
      assetCode: 'XLM',
    });
    expect(amount).toEqual({
      assetCode: 'XLM',
      amount: '50.25',
    });
  });

  it('validates resulting amount against normalizeMoneyAmount', () => {
    const built = toMoneyAmount(75.5, 'XLM', undefined, 2);
    const normalized = normalizeMoneyAmount(built);
    expect(normalized.amount).toBe('75.50');
  });

  it('throws RangeError for invalid assetCode or amount', () => {
    expect(() => toMoneyAmount(10, '')).toThrow(RangeError);
    expect(() => toMoneyAmount('invalid-amount', 'XLM')).toThrow(RangeError);
  });
});

describe('subpath and root module re-exports', () => {
  it('exports toAmountString, toMoneyAmount, and MAX_STELLAR_SCALE from models subpath', () => {
    expect(typeof ModelsExports.toAmountString).toBe('function');
    expect(typeof ModelsExports.toMoneyAmount).toBe('function');
    expect(ModelsExports.MAX_STELLAR_SCALE).toBe(MAX_STELLAR_SCALE);
  });

  it('exports toAmountString, toMoneyAmount, and MAX_STELLAR_SCALE from root package', () => {
    expect(typeof RootExports.toAmountString).toBe('function');
    expect(typeof RootExports.toMoneyAmount).toBe('function');
    expect(RootExports.MAX_STELLAR_SCALE).toBe(MAX_STELLAR_SCALE);
  });
});
