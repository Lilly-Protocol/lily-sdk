import { describe, it, expect } from 'vitest';
import { toAmountString, toMoneyAmount } from '../src/models/common';
import * as rootExports from '../src/index';
import * as modelExports from '../src/models/index';

describe('toAmountString & toMoneyAmount (issue #449)', () => {
  describe('toAmountString', () => {
    it('eliminates 0.1 + 0.2 floating-point artifacts', () => {
      const sum = 0.1 + 0.2;
      expect(toAmountString(sum)).toBe('0.3');
      expect(toAmountString(sum, 2)).toBe('0.30');
      expect(toAmountString(sum, 7)).toBe('0.3000000');
    });

    it('handles various floating-point operations cleanly', () => {
      expect(toAmountString(0.1 * 3)).toBe('0.3');
      expect(toAmountString(0.7 + 0.1)).toBe('0.8');
      expect(toAmountString(1.0 - 0.9)).toBe('0.1');
    });

    it('expands exponential notation without scientific symbols', () => {
      expect(toAmountString(1e-5)).toBe('0.00001');
      expect(toAmountString(1e-7)).toBe('0.0000001');
      expect(toAmountString(1.25e-5)).toBe('0.0000125');
      expect(toAmountString(1.5e4)).toBe('15000');
      expect(toAmountString('1e-7')).toBe('0.0000001');
      expect(toAmountString('2.5e3')).toBe('2500');
    });

    it('handles zero and negative-zero correctly', () => {
      expect(toAmountString(0)).toBe('0');
      expect(toAmountString(0, 2)).toBe('0.00');
      expect(toAmountString(0, 7)).toBe('0.0000000');
      expect(toAmountString(-0)).toBe('0');
      expect(toAmountString('0')).toBe('0');
      expect(toAmountString('0.00', 2)).toBe('0.00');
    });

    it('handles large integers and bigints without precision loss', () => {
      expect(toAmountString(1000000)).toBe('1000000');
      expect(toAmountString(1000000, 2)).toBe('1000000.00');
      expect(toAmountString(1000000000000n)).toBe('1000000000000');
      expect(toAmountString(1000000000000n, 2)).toBe('1000000000000.00');
    });

    it('rounds fractional digits exceeding 7 decimal places using half-up policy', () => {
      // 1.23456789 has 8 fractional digits -> rounds up at 8th digit (9 >= 5) to 7 digits
      expect(toAmountString(1.23456789)).toBe('1.2345679');
      // 1.23456781 rounds down (1 < 5) to 7 digits
      expect(toAmountString(1.23456781)).toBe('1.2345678');
      // Rollover cascade on 9s
      expect(toAmountString(0.99999999)).toBe('1.0000000');
    });

    it('respects explicit scale parameter', () => {
      expect(toAmountString(12.3456, 2)).toBe('12.35');
      expect(toAmountString(12.3444, 2)).toBe('12.34');
      expect(toAmountString(12.3, 3)).toBe('12.300');
      expect(toAmountString(12, 0)).toBe('12');
      expect(toAmountString(12.7, 0)).toBe('13');
    });

    it('rejects invalid scale values', () => {
      expect(() => toAmountString(10, -1)).toThrow(RangeError);
      expect(() => toAmountString(10, 8)).toThrow(RangeError);
      expect(() => toAmountString(10, 2.5)).toThrow(RangeError);
    });

    it('rejects negative numbers and bigints', () => {
      expect(() => toAmountString(-1)).toThrow(RangeError);
      expect(() => toAmountString(-0.001)).toThrow(RangeError);
      expect(() => toAmountString(-50n)).toThrow(RangeError);
      expect(() => toAmountString('-10.50')).toThrow(RangeError);
    });

    it('rejects non-finite and NaN values', () => {
      expect(() => toAmountString(NaN)).toThrow(RangeError);
      expect(() => toAmountString(Infinity)).toThrow(RangeError);
      expect(() => toAmountString(-Infinity)).toThrow(RangeError);
    });
  });

  describe('toMoneyAmount', () => {
    it('creates native XLM MoneyAmount', () => {
      const money = toMoneyAmount(0.1 + 0.2, 'XLM');
      expect(money).toEqual({
        assetCode: 'XLM',
        amount: '0.3',
      });
      expect(money.assetIssuer).toBeUndefined();
    });

    it('creates issued asset MoneyAmount with custom scale and issuer', () => {
      const issuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
      const money = toMoneyAmount(0.1 + 0.2, 'USDC', issuer, 2);
      expect(money).toEqual({
        assetCode: 'USDC',
        assetIssuer: issuer,
        amount: '0.30',
      });
    });
  });

  describe('exports verification', () => {
    it('exports toAmountString and toMoneyAmount from root index', () => {
      expect(typeof rootExports.toAmountString).toBe('function');
      expect(typeof rootExports.toMoneyAmount).toBe('function');
    });

    it('exports toAmountString and toMoneyAmount from models subpath', () => {
      expect(typeof modelExports.toAmountString).toBe('function');
      expect(typeof modelExports.toMoneyAmount).toBe('function');
    });
  });
});
