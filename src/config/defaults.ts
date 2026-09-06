import type { RetryPolicy } from '../http/types';

/**
 * Default per-request/SDK timeout in milliseconds.
 * Single source of truth shared by `resolveLilySdkConfig` and the fetch
 * transport; re-exported from `@lily-protocol/sdk/config` and the root
 * entrypoint so consumers building custom `HttpClient` implementations or
 * documentation can reference it instead of hard-coding the value.
 */
export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Default retry policy applied when no `retry` overrides are provided.
 * Single source of truth shared by `resolveLilySdkConfig` (as the base
 * policy) and the fetch transport (as the retryable status code fallback),
 * so the two copies can no longer drift apart silently.
 */
export const DEFAULT_RETRY_POLICY: Readonly<RetryPolicy> = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
};
