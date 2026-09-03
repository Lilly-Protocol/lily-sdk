import type { RetryPolicy } from '../http/types';

/**
 * Default per-request timeout in milliseconds, applied when `timeoutMs` is
 * not provided in the SDK config. Exported as a single source of truth so
 * custom `HttpClient` implementations and documentation can reference it.
 */
export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Default retry policy applied when `retry` is not provided in the SDK
 * config. Exported as a single source of truth so custom `HttpClient`
 * implementations and documentation can reference it.
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
};

/**
 * Read-only view of the default retryable HTTP status codes. Shared between
 * the config resolver and the fetch transport so the fallback list cannot
 * drift apart from the resolved default policy.
 */
export const DEFAULT_RETRYABLE_STATUS_CODES: readonly number[] =
  DEFAULT_RETRY_POLICY.retryableStatusCodes;
