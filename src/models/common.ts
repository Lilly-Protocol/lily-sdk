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

export interface NormalizeMoneyAmountOptions {
  /**
   * Target decimal scale between 0 and 7.
   * If omitted, preserves all fractional digits up to 7 (minimum 2 decimal places).
   */
  scale?: number;

  /**
   * When true, rounds to the specified scale using half-up rounding instead of truncating.
   * @default false
   */
  round?: boolean;
}

/**
 * Normalizes a decimal string amount, preserving up to 7 fractional digits (Stellar stroops)
 * or formatting to an explicit target scale.
 *
 * Leading zeros on the integer part are stripped (e.g. `'0075.5'` becomes `'75.50'`).
 * When no scale is specified, fractional values with fewer than two digits are padded
 * to two places, and sub-cent precision up to 7 digits is preserved without truncation.
 *
 * When an explicit scale is provided, excess decimal places are truncated by default,
 * or rounded half-up when `round` is true. Amounts exceeding Stellar's 7-decimal limit
 * are rounded to 7 decimal places.
 *
 * @param input - The MoneyAmount object to normalize. The input object is not mutated.
 * @param scaleOrOptions - Explicit target scale (0-7) or normalization options object.
 * @param options - Additional options when scale is passed as a number.
 * @returns A new MoneyAmount object with normalized amount string.
 * @throws {RangeError} When scale is not an integer between 0 and 7.
 *
 * @example
 * ```ts
 * normalizeMoneyAmount({ assetCode: 'USDC', amount: '100' });
 * // => { assetCode: 'USDC', amount: '100.00' }
 *
 * normalizeMoneyAmount({ assetCode: 'XLM', amount: '0.0000001' });
 * // => { assetCode: 'XLM', amount: '0.0000001' }
 *
 * normalizeMoneyAmount({ assetCode: 'USDC', amount: '1.234567' }, 2);
 * // => { assetCode: 'USDC', amount: '1.23' }
 *
 * normalizeMoneyAmount({ assetCode: 'USDC', amount: '1.235' }, 2, { round: true });
 * // => { assetCode: 'USDC', amount: '1.24' }
 * ```
 */
export function normalizeMoneyAmount(
  input: MoneyAmount,
  scaleOrOptions?: number | NormalizeMoneyAmountOptions,
  options?: NormalizeMoneyAmountOptions,
): MoneyAmount {
  let targetScale: number | undefined;
  let round = false;

  if (typeof scaleOrOptions === 'number') {
    targetScale = scaleOrOptions;
    round = options?.round ?? false;
  } else if (typeof scaleOrOptions === 'object') {
    targetScale = scaleOrOptions.scale;
    round = scaleOrOptions.round ?? false;
  }

  if (
    targetScale !== undefined &&
    (!Number.isInteger(targetScale) || targetScale < 0 || targetScale > 7)
  ) {
    throw new RangeError(
      `Scale must be an integer between 0 and 7. Got ${String(targetScale)}.`,
    );
  }

  const [wholeRaw = '', fractionRaw = ''] = input.amount.split('.');
  const wholeClean = wholeRaw.replace(/^0+(?=\d)/, '') || '0';

  let normalizedAmount: string;

  if (targetScale === undefined) {
    if (fractionRaw.length < 2) {
      normalizedAmount = `${wholeClean}.${fractionRaw.padEnd(2, '0')}`;
    } else if (fractionRaw.length <= 7) {
      normalizedAmount = `${wholeClean}.${fractionRaw}`;
    } else {
      normalizedAmount = roundDecimal(wholeClean, fractionRaw, 7);
    }
  } else if (targetScale === 0) {
    if (!round) {
      normalizedAmount = wholeClean;
    } else {
      normalizedAmount = roundDecimal(wholeClean, fractionRaw, 0);
    }
  } else if (!round) {
    const fraction = fractionRaw.slice(0, targetScale).padEnd(targetScale, '0');
    normalizedAmount = `${wholeClean}.${fraction}`;
  } else {
    normalizedAmount = roundDecimal(wholeClean, fractionRaw, targetScale);
  }

  return { ...input, amount: normalizedAmount };
}

function roundDecimal(whole: string, fraction: string, scale: number): string {
  if (fraction.length <= scale) {
    return scale === 0 ? whole : `${whole}.${fraction.padEnd(scale, '0')}`;
  }

  const nextDigit = Number(fraction[scale]);
  if (nextDigit < 5) {
    return scale === 0 ? whole : `${whole}.${fraction.slice(0, scale)}`;
  }

  const truncatedFraction = fraction.slice(0, scale);
  const combined = `${whole}${truncatedFraction}`;
  const incremented = (BigInt(combined) + BigInt(1)).toString();

  if (scale === 0) {
    return incremented;
  }

  if (incremented.length <= scale) {
    const padded = incremented.padStart(scale + 1, '0');
    return `${padded.slice(0, -scale)}.${padded.slice(-scale)}`;
  }

  return `${incremented.slice(0, -scale)}.${incremented.slice(-scale)}`;
}
