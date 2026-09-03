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
  'pending' | 'active' | 'inactive' | 'failed' | 'paused';

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
