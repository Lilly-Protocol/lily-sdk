import { LilyValidationError } from '../errors/sdk-error';
import type { MoneyAmount } from './common';

const STELLAR_DECIMAL_REGEX = /^\d+(\.\d{1,7})?$/;
const ASSET_CODE_REGEX = /^[a-zA-Z0-9]{1,12}$/;
const MEMO_MAX_BYTES = 28;

export function validateMoneyAmount(amount: MoneyAmount): void {
  if (!ASSET_CODE_REGEX.test(amount.assetCode)) {
    throw new LilyValidationError(
      `Invalid asset code "${amount.assetCode}": must be 1-12 alphanumeric characters.`,
      { code: 'INVALID_ASSET_CODE' },
    );
  }

  if (!STELLAR_DECIMAL_REGEX.test(amount.amount)) {
    throw new LilyValidationError(
      `Invalid amount "${amount.amount}": must be a non-negative decimal with at most 7 fractional digits.`,
      { code: 'INVALID_AMOUNT_FORMAT' },
    );
  }

  if (Number(amount.amount) < 0) {
    throw new LilyValidationError(
      `Invalid amount "${amount.amount}": must be non-negative.`,
      { code: 'NEGATIVE_AMOUNT' },
    );
  }
}

export function validateMemo(memo: string | undefined): void {
  if (memo === undefined) return;

  const byteLength = Buffer.byteLength(memo, 'utf8');
  if (byteLength > MEMO_MAX_BYTES) {
    throw new LilyValidationError(
      `Memo exceeds maximum length of ${String(MEMO_MAX_BYTES)} bytes (got ${String(byteLength)}).`,
      { code: 'MEMO_TOO_LONG' },
    );
  }
}
