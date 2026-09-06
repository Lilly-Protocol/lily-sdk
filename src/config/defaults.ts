import type { RetryPolicy } from '../http/types';

/** Default request timeout in milliseconds applied by `resolveLilySdkConfig`. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Default HTTP status codes eligible for retry on idempotent methods. */
export const DEFAULT_RETRYABLE_STATUS_CODES: number[] = [
  408, 409, 425, 429, 500, 502, 503, 504,
];

/** Default retry budget used by config resolution and the fetch HTTP client. */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: DEFAULT_RETRYABLE_STATUS_CODES,
};
