import { LilyValidationError } from './errors/sdk-error';
import type { MoneyAmount } from './models/common';
import type { ResolveIdentityRequest } from './models/identity';
import type {
  ExecutePaymentRequest,
  PaymentQuoteRequest,
} from './models/payment';

const NON_EMPTY_STRING_PATTERN = /\S/;
const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d+)?$/;
const STELLAR_ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

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
}

export function validatePaymentQuoteRequest(
  request: PaymentQuoteRequest,
): void {
  validateNonEmptyString(request.fromWalletId, 'fromWalletId');
  validateNonEmptyString(request.toAddress, 'toAddress');
  validateMoneyAmount(request.amount, 'PaymentQuoteRequest');
}
