import type { RetryPolicy } from '../http/types';

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
};
export const DEFAULT_RETRYABLE_STATUS_CODES = DEFAULT_RETRY_POLICY.retryableStatusCodes;
