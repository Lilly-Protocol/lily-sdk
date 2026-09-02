import { LilyValidationError } from './errors/sdk-error';
import type { MoneyAmount } from './models/common';
import type {
  ExecutePaymentRequest,
  PaymentQuoteRequest,
} from './models/payment';
import type { ResolveIdentityRequest } from './models/identity';

const NON_EMPTY_STRING_PATTERN = /\S/;
const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d+)?$/;
const STELLAR_ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;
const MAX_STELLAR_FRACTIONAL_DIGITS = 7;
const MAX_MEMO_TEXT_LENGTH = 28;
const MEMO_HEX_PATTERN = /^(?:[0-9a-fA-F]{2})*$/;
const MAX_MEMO_HEX_LENGTH = 64;

export function validateNonEmptyString(
  value: unknown,
  fieldName: string,
): void {
  if (typeof value !== 'string' || !NON_EMPTY_STRING_PATTERN.test(value)) {
    throw new LilyValidationError(
      `\`${fieldName}\` must be a non-empty string.`,
    );
  }
}

export function validateMoneyAmount(
  amount: MoneyAmount,
  context: string,
): void {
  if (!amount || typeof amount !== 'object') {
    throw new LilyValidationError(`${context}: \`amount\` is required.`);
  }

  if (
    typeof amount.assetCode !== 'string' ||
    !STELLAR_ASSET_CODE_PATTERN.test(amount.assetCode)
  ) {
    throw new LilyValidationError(
      `${context}: \`assetCode\` must be a 1-12 character alphanumeric Stellar asset code.`,
    );
  }

  if (
    typeof amount.amount !== 'string' ||
    !DECIMAL_AMOUNT_PATTERN.test(amount.amount)
  ) {
    throw new LilyValidationError(
      `${context}: \`amount\` must be a non-negative decimal string (e.g. "10.50").`,
    );
  }

  const dotIndex = amount.amount.indexOf('.');
  if (dotIndex !== -1) {
    const fractionalDigits = amount.amount.length - dotIndex - 1;
    if (fractionalDigits > MAX_STELLAR_FRACTIONAL_DIGITS) {
      throw new LilyValidationError(
        `${context}: \`amount\` must have at most ${MAX_STELLAR_FRACTIONAL_DIGITS} fractional digits (Stellar limit). Got ${fractionalDigits}.`,
      );
    }
  }

  if (amount.assetIssuer !== undefined) {
    if (
      typeof amount.assetIssuer !== 'string' ||
      !NON_EMPTY_STRING_PATTERN.test(amount.assetIssuer)
    ) {
      throw new LilyValidationError(
        `${context}: \`assetIssuer\` must be a non-empty string when provided.`,
      );
    }
  }
}

export function validateMemo(memo: unknown, context: string): void {
  if (memo === undefined || memo === null) {
    return;
  }

  if (typeof memo !== 'string') {
    throw new LilyValidationError(
      `${context}: \`memo\` must be a string when provided.`,
    );
  }

  if (MEMO_HEX_PATTERN.test(memo) && memo.length > 0) {
    if (memo.length > MAX_MEMO_HEX_LENGTH) {
      throw new LilyValidationError(
        `${context}: \`memo\` hex string must be at most ${MAX_MEMO_HEX_LENGTH} characters. Got ${memo.length}.`,
      );
    }
    return;
  }

  const memoBytes = new TextEncoder().encode(memo).length;
  if (memoBytes > MAX_MEMO_TEXT_LENGTH) {
    throw new LilyValidationError(
      `${context}: \`memo\` text must be at most ${MAX_MEMO_TEXT_LENGTH} bytes (Stellar limit). Got ${memoBytes}.`,
    );
  }
}

export function validateResolveIdentityRequest(
  request: ResolveIdentityRequest,
): void {
  const keys = [request.agentId, request.stellarAddress, request.domain].filter(
    (v) => v !== undefined && v !== null,
  );

  if (keys.length === 0) {
    throw new LilyValidationError(
      '`ResolveIdentityRequest` requires exactly one of `agentId`, `stellarAddress`, or `domain`.',
    );
  }

  if (keys.length > 1) {
    throw new LilyValidationError(
      '`ResolveIdentityRequest` accepts only one resolver key at a time. Provide exactly one of `agentId`, `stellarAddress`, or `domain`.',
    );
  }

  const providedKey =
    request.agentId !== undefined
      ? 'agentId'
      : request.stellarAddress !== undefined
        ? 'stellarAddress'
        : 'domain';
  const providedValue = request[providedKey as keyof ResolveIdentityRequest];

  if (
    typeof providedValue !== 'string' ||
    !NON_EMPTY_STRING_PATTERN.test(providedValue)
  ) {
    throw new LilyValidationError(
      `\`${providedKey}\` must be a non-empty string.`,
    );
  }
}

export function validateExecutePaymentRequest(
  request: ExecutePaymentRequest,
): void {
  validateNonEmptyString(request.fromWalletId, 'fromWalletId');
  validateNonEmptyString(request.toAddress, 'toAddress');
  validateMoneyAmount(request.amount, 'ExecutePaymentRequest');
  validateMemo(request.memo, 'ExecutePaymentRequest');
}

export function validatePaymentQuoteRequest(
  request: PaymentQuoteRequest,
): void {
  validateNonEmptyString(request.fromWalletId, 'fromWalletId');
  validateNonEmptyString(request.toAddress, 'toAddress');
  validateMoneyAmount(request.amount, 'PaymentQuoteRequest');
}
