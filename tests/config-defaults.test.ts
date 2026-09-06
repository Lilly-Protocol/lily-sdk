import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_POLICY,
  resolveLilySdkConfig,
} from '../src/config';

/**
 * Issue #450 — the default timeout and retry policy must live in a single
 * shared module (`src/config/defaults.ts`) consumed by both the config
 * resolver and the fetch transport, and must be exported so consumers can
 * reference the effective defaults instead of hard-coding them.
 */
describe('shared config defaults (issue #450)', () => {
  it('exports the default timeout matching the resolved default', () => {
    const resolved = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
    });
    expect(resolved.timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
  });

  it('exports the default retry policy matching the resolved default', () => {
    const resolved = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
    });
    expect(resolved.retry).toEqual(DEFAULT_RETRY_POLICY);
  });

  it('exposes the default retryable status codes used by the transport fallback', () => {
    expect(DEFAULT_RETRY_POLICY.retryableStatusCodes).toEqual([
      408, 409, 425, 429, 500, 502, 503, 504,
    ]);
  });

  it('no longer duplicates the retryable status code list in the fetch transport', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/http/fetch-http-client.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/DEFAULT_RETRYABLE_STATUS_CODES\s*=\s*\[/);
    expect(source).toContain('DEFAULT_RETRY_POLICY');
  });
});
