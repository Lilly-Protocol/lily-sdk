import { LilyValidationError } from '../errors/sdk-error';
import type { MoneyAmount } from '../models/common';
import type { ExecutePaymentRequest, PaymentQuoteRequest } from '../models/payment';

/** Stellar text memos are at most 28 bytes. Hash/ID memos are 64 hex chars. */
const TEXT_MEMO_MAX_BYTES = 28;
const HEX_MEMO_MAX_CHARS = 64;
const AMOUNT_RE = /^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/;
const ASSET_CODE_RE = /^[A-Za-z0-9]{1,12}$/;
const HEX_RE = /^[0-9a-fA-F]+$/;

export function assertMemo(memo: string | undefined): void {
  if (memo == null || memo === '') {
    return;
  }
  const bytes = new TextEncoder().encode(memo).length;
  const hexOk = HEX_RE.test(memo) && memo.length <= HEX_MEMO_MAX_CHARS && memo.length % 2 === 0;
  if (hexOk) {
    return;
  }
  if (bytes > TEXT_MEMO_MAX_BYTES) {
    throw new LilyValidationError(
      `memo exceeds Stellar text limit of ${TEXT_MEMO_MAX_BYTES} bytes (got ${bytes})`,
      { code: 'INVALID_MEMO' },
    );
  }
}

export function assertMoneyAmount(amount: MoneyAmount | undefined, field = 'amount'): void {
  if (!amount || typeof amount.amount !== 'string' || amount.amount === '') {
    throw new LilyValidationError(`${field} is required`, { code: 'INVALID_AMOUNT' });
  }
  if (amount.amount.startsWith('-') || !AMOUNT_RE.test(amount.amount)) {
    throw new LilyValidationError(
      `${field} must be a non-negative decimal with at most 7 fractional digits`,
      { code: 'INVALID_AMOUNT' },
    );
  }
  if (!ASSET_CODE_RE.test(amount.assetCode || '')) {
    throw new LilyValidationError(
      'assetCode must be 1-12 alphanumeric characters',
      { code: 'INVALID_ASSET_CODE' },
    );
  }
}

export function assertPaymentInputs(input: ExecutePaymentRequest | PaymentQuoteRequest): void {
  assertMoneyAmount(input.amount);
  if ('memo' in input) {
    assertMemo(input.memo);
  }
}
