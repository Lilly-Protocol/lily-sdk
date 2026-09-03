import { LilyValidationError } from '../errors/sdk-error';
import type { ExecutePaymentRequest, MoneyAmount, PaymentQuoteRequest } from '../models';

const MAX_MEMO_TEXT_BYTES = 28;
const HASH_MEMO_HEX_PATTERN = /^[0-9a-fA-F]{64}$/;
const ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/;

function invalid(message: string): never {
  throw new LilyValidationError(message, { code: 'VALIDATION_ERROR' });
}

export function validateMemo(memo: string | undefined): void {
  if (memo === undefined) {
    return;
  }

  if (HASH_MEMO_HEX_PATTERN.test(memo)) {
    return;
  }

  const byteLength = new TextEncoder().encode(memo).byteLength;
  if (byteLength > MAX_MEMO_TEXT_BYTES) {
    invalid('`memo` must be at most 28 UTF-8 bytes, or a 64-character hexadecimal hash.');
  }
}

export function validateMoneyAmount(amount: MoneyAmount): void {
  if (!ASSET_CODE_PATTERN.test(amount.assetCode)) {
    invalid('`amount.assetCode` must be 1-12 alphanumeric characters.');
  }

  if (!AMOUNT_PATTERN.test(amount.amount)) {
    invalid(
      '`amount.amount` must be a non-negative decimal with at most 7 fractional digits.',
    );
  }
}

export function validatePaymentQuoteRequest(input: PaymentQuoteRequest): void {
  validateMoneyAmount(input.amount);
}

export function validateExecutePaymentRequest(input: ExecutePaymentRequest): void {
  validateMoneyAmount(input.amount);
  validateMemo(input.memo);
}
