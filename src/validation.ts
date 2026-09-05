import { LilyValidationError } from './errors/sdk-error';
import type { MoneyAmount, ResourceStatus } from './models/common';
import type {
  CreateAgentRequest,
  UpdateAgentRequest,
} from './models/agent';
import type { ProvisionWalletRequest } from './models/wallet';
import type {
  ExecutePaymentRequest,
  PaymentQuoteRequest,
} from './models/payment';
import type { ResolveIdentityRequest } from './models/identity';

const VALID_NETWORKS = new Set(['stellar-testnet', 'stellar-mainnet']);
const VALID_RESOURCE_STATUSES = new Set<ResourceStatus>([
  'pending',
  'active',
  'inactive',
  'failed',
  'paused',
]);

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
  context = 'MoneyAmount',
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

export function validateMemo(memo: unknown, context = 'Payment'): void {
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

export function validateProvisionWalletRequest(
  request: ProvisionWalletRequest,
): void {
  if (!request || typeof request !== 'object') {
    throw new LilyValidationError(
      'ProvisionWalletRequest: request body is required.',
    );
  }

  validateNonEmptyString(request.agentId, 'agentId');

  if (!VALID_NETWORKS.has(request.network)) {
    throw new LilyValidationError(
      "ProvisionWalletRequest: `network` must be 'stellar-testnet' or 'stellar-mainnet'.",
    );
  }

  if (request.fundingAsset !== undefined && request.fundingAsset !== null) {
    validateMoneyAmount(
      request.fundingAsset as MoneyAmount,
      'ProvisionWalletRequest.fundingAsset',
    );
  }
}

export function validateCreateAgentRequest(
  request: CreateAgentRequest,
): void {
  if (!request || typeof request !== 'object') {
    throw new LilyValidationError(
      'CreateAgentRequest: request body is required.',
    );
  }

  validateNonEmptyString(request.name, 'name');

  if (!VALID_NETWORKS.has(request.network)) {
    throw new LilyValidationError(
      "CreateAgentRequest: `network` must be 'stellar-testnet' or 'stellar-mainnet'.",
    );
  }

  if (
    request.description !== undefined &&
    request.description !== null &&
    typeof request.description !== 'string'
  ) {
    throw new LilyValidationError(
      'CreateAgentRequest: `description` must be a string when provided.',
    );
  }

  if (request.capabilities !== undefined && request.capabilities !== null) {
    if (!Array.isArray(request.capabilities)) {
      throw new LilyValidationError(
        'CreateAgentRequest: `capabilities` must be an array when provided.',
      );
    }
    for (const cap of request.capabilities) {
      if (typeof cap !== 'string' || !NON_EMPTY_STRING_PATTERN.test(cap)) {
        throw new LilyValidationError(
          'CreateAgentRequest: each capability must be a non-empty string.',
        );
      }
    }
  }

  if (request.metadata !== undefined && request.metadata !== null) {
    if (typeof request.metadata !== 'object' || Array.isArray(request.metadata)) {
      throw new LilyValidationError(
        'CreateAgentRequest: `metadata` must be an object when provided.',
      );
    }
  }
}

export function validateUpdateAgentRequest(
  request: UpdateAgentRequest,
): void {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new LilyValidationError(
      'UpdateAgentRequest: request body must be an object.',
    );
  }

  const hasUpdate =
    request.name !== undefined ||
    request.description !== undefined ||
    request.capabilities !== undefined ||
    request.status !== undefined;

  if (!hasUpdate) {
    throw new LilyValidationError(
      'UpdateAgentRequest: at least one update field must be provided.',
    );
  }

  if (request.name !== undefined) {
    validateNonEmptyString(request.name, 'name');
  }

  if (
    request.description !== undefined &&
    request.description !== null &&
    typeof request.description !== 'string'
  ) {
    throw new LilyValidationError(
      'UpdateAgentRequest: `description` must be a string when provided.',
    );
  }

  if (request.capabilities !== undefined && request.capabilities !== null) {
    if (!Array.isArray(request.capabilities)) {
      throw new LilyValidationError(
        'UpdateAgentRequest: `capabilities` must be an array when provided.',
      );
    }
    for (const cap of request.capabilities) {
      if (typeof cap !== 'string' || !NON_EMPTY_STRING_PATTERN.test(cap)) {
        throw new LilyValidationError(
          'UpdateAgentRequest: each capability must be a non-empty string.',
        );
      }
    }
  }

  if (
    request.status !== undefined &&
    !VALID_RESOURCE_STATUSES.has(request.status)
  ) {
    throw new LilyValidationError(
      "UpdateAgentRequest: `status` must be one of: 'pending', 'active', 'inactive', 'failed', 'paused'.",
    );
  }
}

