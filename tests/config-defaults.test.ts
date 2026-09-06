import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RETRY_POLICY,
  DEFAULT_RETRYABLE_STATUS_CODES,
  DEFAULT_TIMEOUT_MS,
  resolveLilySdkConfig,
} from '../src/config';

describe('exported config defaults', () => {
  it('equal the effective defaults after resolution', () => {
    const resolved = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
    });

    expect(DEFAULT_TIMEOUT_MS).toBe(resolved.timeoutMs);
    expect(DEFAULT_RETRY_POLICY).toEqual(resolved.retry);
    expect(DEFAULT_RETRYABLE_STATUS_CODES).toEqual(
      resolved.retry.retryableStatusCodes,
    );
  });
});
