import { describe, it, expect } from 'vitest';
import { toAmountString } from '../src/models/common';

describe('toAmountString (issue #449)', () => {
  it('fixes the classic 0.1 + 0.2 floating-point artifact', () => {
    expect(toAmountString(0.1 + 0.2)).toBe('0.3000000');
  });

  it('handles zero correctly', () => {
    expect(toAmountString(0)).toBe('0.0000000');
    expect(toAmountString(0, 2)).toBe('0.00');
  });

  it('handles large integers without scientific notation', () => {
    expect(toAmountString(123456789)).toBe('123456789.0000000');
  });

  it('respects custom scale parameter', () => {
    expect(toAmountString(1.5, 2)).toBe('1.50');
    expect(toAmountString(1.5, 0)).toBe('2');
  });

  it('throws on non-finite values', () => {
    expect(() => toAmountString(NaN)).toThrow(TypeError);
    expect(() => toAmountString(Infinity)).toThrow(TypeError);
  });

  it('throws on invalid scale', () => {
    expect(() => toAmountString(1, -1)).toThrow(TypeError);
    expect(() => toAmountString(1, 1.5)).toThrow(TypeError);
  });
});
