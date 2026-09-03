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
 * Options for {@link normalizeMoneyAmount}.
 */
export interface NormalizeMoneyAmountOptions {
  /**
   * Explicit fractional scale (0-7).
   * When omitted, formats whole and single-digit decimals to 2 decimal places,
   * while preserving up to 7 decimal places for sub-cent amounts without precision loss.
   */
  scale?: number;
}

/**
 * Normalizes a decimal string amount.
 *
 * Leading zeros are stripped. By default, formats whole and single-digit decimals
 * to at least 2 decimal places (e.g. `'100'` -> `'100.00'`, `'50.5'` -> `'50.50'`),
 * while preserving up to 7 decimal places for Stellar sub-cent amounts (e.g. `'0.0000001'`),
 * ensuring non-zero fractions are never silently dropped or zeroed out.
 *
 * If an explicit `scale` is provided (either as an options object or number),
 * the fraction is truncated/padded to that scale.
 *
 * Throws a `RangeError` when the amount is not a base-10 decimal string
 * or when `scale` is outside the allowed [0, 7] range.
 */
export function normalizeMoneyAmount(
  input: MoneyAmount,
  options?: NormalizeMoneyAmountOptions | number,
): MoneyAmount {
  if (
    typeof input.amount !== 'string' ||
    !DECIMAL_AMOUNT_PATTERN.test(input.amount)
  ) {
    throw new RangeError(
      `MoneyAmount.amount must be a base-10 decimal string, got ${JSON.stringify(input.amount)}.`,
    );
  }

  const explicitScale = typeof options === 'number' ? options : options?.scale;
  if (
    explicitScale !== undefined &&
    (!Number.isInteger(explicitScale) || explicitScale < 0 || explicitScale > 7)
  ) {
    throw new RangeError('scale must be an integer between 0 and 7.');
  }

  const [wholeRaw = '', fractionRaw = ''] = input.amount.split('.');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0';

  if (explicitScale !== undefined) {
    if (explicitScale === 0) {
      return { ...input, amount: whole };
    }
    const fraction = fractionRaw.slice(0, explicitScale).padEnd(explicitScale, '0');
    return { ...input, amount: `${whole}.${fraction}` };
  }

  const targetScale = Math.min(7, Math.max(2, fractionRaw.length));
  const fraction = fractionRaw.slice(0, targetScale).padEnd(Math.max(2, targetScale), '0');
  return { ...input, amount: `${whole}.${fraction}` };
}
