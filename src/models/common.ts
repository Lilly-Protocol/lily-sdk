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

/**
 * Maximum precision scale supported by the Stellar network (1 stroop = 0.0000001).
 */
export const MAX_STELLAR_SCALE = 7;

/**
 * Converts a JavaScript `number` into a safe, base-10 fixed-decimal string
 * suitable for `MoneyAmount.amount`, eliminating IEEE-754 floating-point artifacts
 * (e.g. `0.1 + 0.2`), expanding scientific/exponential notation (e.g. `1e-7`),
 * and enforcing a documented rounding/scale policy.
 *
 * ### Rounding Policy:
 * - **When `scale` is specified:** The value is rounded half-up (`Math.round`) to exactly
 *   `scale` decimal places and padded with trailing zeros to guarantee fixed width.
 * - **When `scale` is omitted (`undefined`):** The value is cleaned of float artifacts,
 *   rounded to Stellar's maximum 7 decimal places, and trailing zeros/decimal points
 *   are stripped (e.g. `0.1 + 0.2` becomes `'0.3'`, `1e-7` becomes `'0.0000001'`).
 *
 * @param value - The numeric amount to convert. Must be a finite number.
 * @param scale - Optional non-negative integer (0–18) defining the exact number of decimal places.
 * @returns A clean, non-exponential base-10 decimal string.
 * @throws {RangeError} If `value` is not a finite number (`NaN`, `Infinity`, `-Infinity`).
 * @throws {RangeError} If `scale` is provided but is negative, non-integer, or greater than 18.
 *
 * @example
 * ```ts
 * toAmountString(0.1 + 0.2); // '0.3' (no float artifacts!)
 * toAmountString(0.1 + 0.2, 2); // '0.30'
 * toAmountString(12.3456, 2); // '12.35'
 * toAmountString(1e-7); // '0.0000001'
 * toAmountString(1000000); // '1000000'
 * ```
 */
export function toAmountString(value: number, scale?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(
      `Money amount must be a finite number, got ${JSON.stringify(value)}.`,
    );
  }

  if (scale !== undefined) {
    if (
      typeof scale !== 'number' ||
      !Number.isInteger(scale) ||
      scale < 0 ||
      scale > 18
    ) {
      throw new RangeError(
        `Scale must be a non-negative integer between 0 and 18, got ${JSON.stringify(scale)}.`,
      );
    }
  }

  if (value === 0) {
    if (scale !== undefined && scale > 0) {
      return `0.${'0'.repeat(scale)}`;
    }
    return '0';
  }

  const isNegative = value < 0;
  const absVal = Math.abs(value);

  // Preserve exact representation for safe integers
  if (Number.isInteger(absVal) && absVal <= Number.MAX_SAFE_INTEGER) {
    const intStr = (isNegative ? '-' : '') + absVal.toString();
    if (scale !== undefined && scale > 0) {
      return `${intStr}.${'0'.repeat(scale)}`;
    }
    return intStr;
  }

  // Eliminate IEEE-754 floating-point accumulator artifacts (e.g. 0.30000000000000004 -> 0.3)
  const cleaned = parseFloat(absVal.toPrecision(15));
  const targetScale = scale !== undefined ? scale : MAX_STELLAR_SCALE;

  const factor = Math.pow(10, targetScale);
  const rounded = Math.round(cleaned * factor) / factor;

  let s = rounded.toFixed(targetScale);

  if (scale === undefined) {
    // Strip redundant trailing zeros and decimal point when scale is not explicitly requested
    s = s.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  }

  return (isNegative ? '-' : '') + s;
}

/**
 * Options bag for constructing a {@link MoneyAmount} using {@link toMoneyAmount}.
 */
export interface ToMoneyAmountOptions {
  /**
   * The monetary quantity as a number or pre-formatted decimal string.
   */
  amount: number | string;

  /**
   * The asset code representing the currency or token (e.g. `'XLM'`, `'USDC'`).
   */
  assetCode: string;

  /**
   * The 56-character Stellar public key (G-address) of the issuing account.
   * Omit or leave undefined for the native asset (`XLM`).
   */
  assetIssuer?: string;

  /**
   * Optional scale/precision for numeric amounts.
   */
  scale?: number;
}

/**
 * Helper to safely construct a {@link MoneyAmount} object from numeric or string amounts.
 *
 * If `amount` is a number, it will be safely converted via {@link toAmountString}
 * avoiding floating-point precision loss. If it is already a string, it will be validated
 * to ensure it is a valid base-10 decimal string.
 *
 * @param amountOrOptions - An options object or the amount (number | string).
 * @param assetCode - The asset code (when calling with positional arguments).
 * @param assetIssuer - Optional issuer public key (when calling with positional arguments).
 * @param scale - Optional scale for numeric rounding (when calling with positional arguments).
 * @returns A validated {@link MoneyAmount} object.
 *
 * @example
 * ```ts
 * const native = toMoneyAmount(0.1 + 0.2, 'XLM');
 * // { assetCode: 'XLM', amount: '0.3' }
 *
 * const usdc = toMoneyAmount({
 *   amount: 100.5,
 *   assetCode: 'USDC',
 *   assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
 *   scale: 2,
 * });
 * // { assetCode: 'USDC', assetIssuer: '...', amount: '100.50' }
 * ```
 */
export function toMoneyAmount(
  amountOrOptions: number | string | ToMoneyAmountOptions,
  assetCode?: string,
  assetIssuer?: string,
  scale?: number,
): MoneyAmount {
  let amountVal: number | string;
  let code: string;
  let issuer: string | undefined;
  let targetScale: number | undefined;

  if (typeof amountOrOptions === 'object' && amountOrOptions !== null) {
    amountVal = amountOrOptions.amount;
    code = amountOrOptions.assetCode;
    issuer = amountOrOptions.assetIssuer;
    targetScale = amountOrOptions.scale;
  } else {
    amountVal = amountOrOptions;
    code = assetCode ?? '';
    issuer = assetIssuer;
    targetScale = scale;
  }

  if (!code || typeof code !== 'string') {
    throw new RangeError('assetCode must be a non-empty string.');
  }

  const finalAmount =
    typeof amountVal === 'number'
      ? toAmountString(amountVal, targetScale)
      : amountVal;

  if (
    typeof finalAmount !== 'string' ||
    !DECIMAL_AMOUNT_PATTERN.test(finalAmount)
  ) {
    throw new RangeError(
      `MoneyAmount.amount must be a base-10 decimal string, got ${JSON.stringify(finalAmount)}.`,
    );
  }

  const result: MoneyAmount = {
    assetCode: code,
    amount: finalAmount,
  };

  if (issuer) {
    result.assetIssuer = issuer;
  }

  return result;
}

