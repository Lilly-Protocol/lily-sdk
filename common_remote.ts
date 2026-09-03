export interface AuditMetadata {
  createdAt:
 string;
  updatedAt: string;
}

export inter
face PaginationQuery {
  limit?: number;
  cu
rsor?: string;
}

/**
 * Represents a monetar
y amount and currency/asset identifier within
 Lily Protocol
 * and the underlying Stellar 
network.
 *
 * All amounts must be formatted 
as base-10 decimal strings (e.g. `'10.50'`) r
ather than
 * JavaScript numbers to prevent f
loating-point precision loss and truncation e
rrors.
 *
 * ### Stellar Asset Semantics:
 * 
- **Native Asset (`XLM`):** Omit `assetIssuer
` (or set to `undefined`). Native Stellar Lum
ens
 *   have no issuing account.
 * - **Issu
ed Assets (e.g. `USDC`, `EURC`):** Specify `a
ssetCode` (1-12 alphanumeric chars) and
 *   
`assetIssuer` (56-character Stellar public ke
y / G-address).
 * - **Precision:** Stellar s
upports up to 7 decimal places (1 stroop = `0
.0000001`).
 *
 * @example
 * ```ts
 * // Nat
ive Stellar Lumens
 * const nativeAmount: Mon
eyAmount = {
 *   assetCode: 'XLM',
 *   amou
nt: '25.5000000',
 * };
 *
 * // Issued asset
 with issuer public key
 * const usdcAmount: 
MoneyAmount = {
 *   assetCode: 'USDC',
 *   
assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM33
5X2KGX3IHOJAPP5RE34K4KZVN',
 *   amount: '100
.00',
 * };
 * ```
 */
export interface Money
Amount {
  /**
   * The asset code representi
ng the currency or token.
   *
   * For the n
ative network asset, use `'XLM'`. For credit/
issued assets, use a 1-to-12 character
   * a
lphanumeric code (Alpha4: 1-4 chars like `'US
DC'`; Alpha12: 5-12 chars).
   */
  assetCode
: string;

  /**
   * The 56-character Stella
r public key (G-address) of the issuing accou
nt.
   *
   * - **Native asset (`XLM`):** Mus
t be omitted or `undefined`.
   * - **Issued 
assets:** Required to uniquely identify the a
sset on Stellar (alongside `assetCode`),
   *
   linking to the issuer's account and home d
omain SEP-1 metadata.
   */
  assetIssuer?: s
tring;

  /**
   * The monetary quantity form
atted strictly as a base-10 decimal string (e
.g., `'10.50'`, `'0.0000001'`).
   *
   * Flo
ating-point numbers (`number`) and exponentia
l notation (e.g., `'1e-5'`) are prohibited
  
 * to avoid floating-point rounding/truncatio
n bugs. Precision should match the asset's sc
ale,
   * up to Stellar's maximum 7 decimal p
laces (1 stroop = 0.0000001).
   */
  amount:
 string;
}

export type ResourceStatus =
  'p
ending' | 'active' | 'inactive' | 'failed' | 
'paused';

const DECIMAL_AMOUNT_PATTERN = /^\
d+(\.\d+)?$/;

/**
 * Normalizes a decimal st
ring amount to exactly two decimal places.
 *

 * Leading zeros are stripped and the fracti
onal part is truncated (not
 * rounded) to tw
o digits and padded with trailing zeros, e.g.

 * `'0075.5'` becomes `'75.50'`. The input o
bject is not mutated.
 *
 * Throws a `RangeEr
ror` when the amount is not a base-10 decimal
 string
 * (e.g. exponential notation like `'
1e-5'` or a JavaScript number).
 */
export fu
nction normalizeMoneyAmount(input: MoneyAmoun
t): MoneyAmount {
  if (
    typeof input.amo
unt !== 'string' ||
    !DECIMAL_AMOUNT_PATTE
RN.test(input.amount)
  ) {
    throw new Ran
geError(
      `MoneyAmount.amount must be a 
base-10 decimal string, got ${JSON.stringify(
input.amount)}.`,
    );
  }
  const [wholeRa
w = '', fractionRaw = ''] = input.amount.spli
t('.');
  const whole = wholeRaw.replace(/^0+
(?=\d)/, '');
  const fraction = fractionRaw.
slice(0, 2).padEnd(2, '0');
  return { ...inp
ut, amount: `${whole}.${fraction}` };
}

/**

 * Safely converts a numeric value to a fixed
-decimal string suitable for MoneyAmount.
 *

 * Uses toFixed to avoid JavaScript floating-
point artifacts
 * (e.g. 0.1 + 0.2 !== 0.3).

 *
 * @param value - The numeric value to con
vert
 * @param scale - Maximum decimal places
 (default: 7, matching Stellar precision)
 * 
@returns A clean base-10 decimal string
 */
e
xport function toAmountString(value: number, 
scale: number = 7): string {
  if (!Number.is
Finite(value)) {
    throw new TypeError('toA
mountString: value must be a finite number');

  }
  if (scale < 0 || !Number.isInteger(sca
le)) {
    throw new TypeError('toAmountStrin
g: scale must be a non-negative integer');
  
}
  return value.toFixed(scale);
}


