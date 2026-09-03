import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RETRY_POLICY,
  DEFAULT_RETRYABLE_STATUS_CODES,
  DEFAULT_TIMEOUT_MS,
} from '../src/config';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

/**
 * Issue #450: the default timeout and retry policy are exported from the
 * `config` entrypoint as a single source of truth, and the config resolver
 * applies exactly those defaults.
 */
describe('shared default timeout and retry constants (issue #450)', () => {
  it('exports the expected default timeout', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(10_000);
  });

  it('exports the expected default retry policy', () => {
    expect(DEFAULT_RETRY_POLICY).toEqual({
      retries: 2,
      retryDelayMs: 250,
      retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
    });
  });

  it('exports the retryable status codes from the shared policy', () => {
    expect(DEFAULT_RETRYABLE_STATUS_CODES).toEqual(
      DEFAULT_RETRY_POLICY.retryableStatusCodes,
    );
  });

  it('applies the exported defaults during config resolution', () => {
    const config = resolveLilySdkConfig({ baseUrl: 'https://api.lily.test' });

    expect(config.timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
    expect(config.retry).toEqual(DEFAULT_RETRY_POLICY);
  });

  it('overrides still win over the exported defaults', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      timeoutMs: 4_000,
      retry: { retries: 5, retryDelayMs: 100 },
    });

    expect(config.timeoutMs).toBe(4_000);
    expect(config.retry).toMatchObject({ retries: 5, retryDelayMs: 100 });
    expect(config.retry.retryableStatusCodes).toEqual(
      DEFAULT_RETRY_POLICY.retryableStatusCodes,
    );
  });
});
