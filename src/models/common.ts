export interface AuditMetadata {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

/**
 * Represents a monetary amount and currency/asset identifier within Lily Protocol
 * and the underlying Stellar network.
 *
 * All amounts must be formatted as base-10 decimal strings (e.g. `'10.50'`) rather than
 * JavaScript numbers to prevent floating-point precision loss and truncation errors.
 *
 * ### Stellar Asset Semantics:
 * - **Native Asset (`XLM`):** Omit `assetIssuer` (or set to `undefined`). Native Stellar Lumens
 *   have no issuing account.
 * - **Issued Assets (e.g. `USDC`, `EURC`):** Specify `assetCode` (1-12 alphanumeric chars) and
 *   `assetIssuer` (56-character Stellar public key / G-address).
 * - **Precision:** Stellar supports up to 7 decimal places (1 stroop = `0.0000001`).
 *
 * @example
 * ```ts
 * // Native Stellar Lumens
 * const nativeAmount: MoneyAmount = {
 *   assetCode: 'XLM',
 *   amount: '25.5000000',
 * };
 *
 * // Issued asset with issuer public key
 * const usdcAmount: MoneyAmount = {
 *   assetCode: 'USDC',
 *   assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
 *   amount: '100.00',
 * };
 * ```
 */
export interface MoneyAmount {
  /**
   * The asset code representing the currency or token.
   *
   * For the native network asset, use `'XLM'`. For credit/issued assets, use a 1-to-12 character
   * alphanumeric code (Alpha4: 1-4 chars like `'USDC'`; Alpha12: 5-12 chars).
   */
  assetCode: string;

  /**
   * The 56-character Stellar public key (G-address) of the issuing account.
   *
   * - **Native asset (`XLM`):** Must be omitted or `undefined`.
   * - **Issued assets:** Required to uniquely identify the asset on Stellar (alongside `assetCode`),
   *   linking to the issuer's account and home domain SEP-1 metadata.
   */
  assetIssuer?: string;

  /**
   * The monetary quantity formatted strictly as a base-10 decimal string (e.g., `'10.50'`, `'0.0000001'`).
   *
   * Floating-point numbers (`number`) and exponential notation (e.g., `'1e-5'`) are prohibited
   * to avoid floating-point rounding/truncation bugs. Precision should match the asset's scale,
   * up to Stellar's maximum 7 decimal places (1 stroop = 0.0000001).
   */
  amount: string;
}

export type ResourceStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'failed'
  | 'paused';

const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d+)?$/;

/**
 * Normalizes a decimal string amount to exactly two decimal places.
 *
 * Leading zeros are stripped and the fractional part is truncated (not
 * rounded) to two digits and padded with trailing zeros, e.g.
 * `'0075.5'` becomes `'75.50'`. The input object is not mutated.
 *
 * Throws a `RangeError` when the amount is not a base-10 decimal string
 * (e.g. exponential notation like `'1e-5'` or a JavaScript number).
 */
export function normalizeMoneyAmount(input: MoneyAmount): MoneyAmount {
  if (
    typeof input.amount !== 'string' ||
    !DECIMAL_AMOUNT_PATTERN.test(input.amount)
  ) {
    throw new RangeError(
      `MoneyAmount.amount must be a base-10 decimal string, got ${JSON.stringify(input.amount)}.`,
    );
  }
  const [wholeRaw = '', fractionRaw = ''] = input.amount.split('.');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '');
  const fraction = fractionRaw.slice(0, 2).padEnd(2, '0');
  return { ...input, amount: `${whole}.${fraction}` };
}

function expandExponential(numStr: string): string {
  if (!numStr.includes('e') && !numStr.includes('E')) {
    return numStr;
  }
  const [lead, expStr = '0'] = numStr.toLowerCase().split('e');
  const exp = parseInt(expStr, 10);
  const [whole = '0', frac = ''] = (lead ?? '0').split('.');

  if (exp > 0) {
    if (frac.length <= exp) {
      return whole + frac + '0'.repeat(exp - frac.length);
    } else {
      return whole + frac.slice(0, exp) + '.' + frac.slice(exp);
    }
  } else {
    const absExp = Math.abs(exp);
    return '0.' + '0'.repeat(absExp - 1) + whole + frac;
  }
}

function roundDecimalString(decStr: string, scale?: number): string {
  const [wholeRaw = '0', fracRaw = ''] = decStr.split('.');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0';

  if (scale === undefined) {
    // Stellar protocol supports up to 7 decimal places (1 stroop = 0.0000001).
    // If fractional digits exceed 7, round half-up to 7 decimal places.
    if (fracRaw.length > 7) {
      return roundDecimalString(decStr, 7);
    }
    return fracRaw.length > 0 ? `${whole}.${fracRaw}` : whole;
  }

  if (scale === 0) {
    if (fracRaw.length > 0 && fracRaw[0] !== undefined && fracRaw[0] >= '5') {
      return (BigInt(whole) + 1n).toString();
    }
    return whole;
  }

  if (fracRaw.length <= scale) {
    return `${whole}.${fracRaw.padEnd(scale, '0')}`;
  }

  const checkDigit = fracRaw[scale];
  const targetDigits = whole + fracRaw.slice(0, scale);
  if (checkDigit !== undefined && checkDigit >= '5') {
    const incremented = (BigInt(targetDigits) + 1n).toString();
    if (incremented.length <= scale) {
      return `0.${incremented.padStart(scale, '0')}`;
    }
    const newWhole = incremented.slice(0, incremented.length - scale);
    const newFrac = incremented.slice(incremented.length - scale);
    return `${newWhole}.${newFrac}`;
  } else {
    return `${whole}.${fracRaw.slice(0, scale)}`;
  }
}

/**
 * Safely converts a numeric value, bigint, or decimal string into a clean base-10
 * decimal string suitable for `MoneyAmount.amount`.
 *
 * Eliminates binary floating-point representation artifacts (e.g., `0.1 + 0.2` becomes `'0.3'`),
 * expands exponential/scientific notation (e.g., `1e-7` becomes `'0.0000001'`), and applies
 * half-up rounding when a scale is specified or when fractional precision exceeds Stellar's
 * 7-digit limit.
 *
 * @param value - The numeric value, bigint, or decimal string to format.
 * @param scale - Optional fractional precision (0 to 7 decimal places). If omitted, significant
 *                fractional digits are preserved up to 7 decimal places.
 * @returns A clean base-10 decimal string representation.
 * @throws {RangeError} If `value` is negative, NaN, non-finite, or if `scale` is outside 0-7.
 * @throws {TypeError} If `value` is not a number, bigint, or string.
 *
 * @example
 * ```ts
 * toAmountString(0.1 + 0.2); // '0.3'
 * toAmountString(0.1 + 0.2, 2); // '0.30'
 * toAmountString(100); // '100'
 * toAmountString(100, 2); // '100.00'
 * toAmountString(1e-7); // '0.0000001'
 * toAmountString(1.23456789, 7); // '1.2345679'
 * ```
 */
export function toAmountString(
  value: number | bigint | string,
  scale?: number,
): string {
  if (scale !== undefined) {
    if (!Number.isInteger(scale) || scale < 0 || scale > 7) {
      throw new RangeError(
        `scale must be an integer between 0 and 7, got ${scale}.`,
      );
    }
  }

  let str: string;
  if (typeof value === 'bigint') {
    if (value < 0n) {
      throw new RangeError(`Amount cannot be negative, got ${value}.`);
    }
    str = value.toString();
  } else if (typeof value === 'number') {
    if (!Number.isFinite(value) || Number.isNaN(value)) {
      throw new RangeError(`Amount must be a finite number, got ${value}.`);
    }
    if (value < 0) {
      throw new RangeError(`Amount cannot be negative, got ${value}.`);
    }
    const val = Object.is(value, -0) ? 0 : value;

    // Eliminate binary floating-point representation artifacts (e.g. 0.1 + 0.2)
    const cleaned = parseFloat(val.toPrecision(12)).toString();
    str = expandExponential(cleaned);
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
      throw new RangeError(
        `Amount must be a non-negative decimal string, got ${JSON.stringify(value)}.`,
      );
    }
    str = expandExponential(trimmed);
  } else {
    throw new TypeError(
      `Amount must be a number, bigint, or string, got ${typeof value}.`,
    );
  }

  return roundDecimalString(str, scale);
}

/**
 * Constructs a valid `MoneyAmount` object from a numeric, bigint, or string amount,
 * safely formatting the decimal string and removing floating-point artifacts.
 *
 * @param amount - The numeric, bigint, or string amount value.
 * @param assetCode - Stellar asset code (e.g., `'XLM'`, `'USDC'`).
 * @param assetIssuer - Optional issuing account public key (required for non-native assets).
 * @param scale - Optional decimal precision (0 to 7).
 * @returns A strictly formatted `MoneyAmount` object.
 *
 * @example
 * ```ts
 * toMoneyAmount(0.1 + 0.2, 'USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', 2);
 * // { assetCode: 'USDC', assetIssuer: 'GA5Z...', amount: '0.30' }
 * ```
 */
export function toMoneyAmount(
  amount: number | bigint | string,
  assetCode: string,
  assetIssuer?: string,
  scale?: number,
): MoneyAmount {
  return {
    assetCode,
    ...(assetIssuer ? { assetIssuer } : {}),
    amount: toAmountString(amount, scale),
  };
}
