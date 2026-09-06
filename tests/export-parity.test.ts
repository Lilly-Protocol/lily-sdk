import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const pkgRoot = resolve(import.meta.dirname, '..');

describe('export-surface parity (issue #424)', () => {
  const subpathDistPaths: Record<string, string> = {
    './config': 'dist/config.cjs',
    './errors': 'dist/errors.cjs',
    './http': 'dist/http.cjs',
    './models': 'dist/models.cjs',
  };

  const subpathExports: Record<string, string[]> = {
    './config': [
      'resolveLilySdkConfig',
      'DEFAULT_TIMEOUT_MS',
      'DEFAULT_RETRY_POLICY',
      'DEFAULT_RETRYABLE_STATUS_CODES',
    ],
    './errors': [
      'LILY_ERROR_CODES',
      'LilySdkError',
      'LilyConfigError',
      'LilyApiError',
      'LilyAuthenticationError',
      'LilyAuthorizationError',
      'LilyConflictError',
      'LilyNotFoundError',
      'LilyRateLimitError',
      'LilyServerError',
      'LilyTransportError',
    ],
    './http': [
      'createFetchHttpClient',
      'buildUrl',
    ],
    './models': [
      'normalizeMoneyAmount',
    ],
  };

  for (const [subpath, expectedSymbols] of Object.entries(subpathExports)) {
    describe(subpath, () => {
      it('exports all expected runtime symbols', () => {
        const mod = require(resolve(pkgRoot, subpathDistPaths[subpath]));
        for (const symbol of expectedSymbols) {
          const msg = symbol + ' missing from ' + subpath + ' export';
          expect(symbol in mod, msg).toBe(true);
        }
      });
    });
  }

  it('root CJS bundle exposes all expected symbols', () => {
    const root = require(resolve(pkgRoot, 'dist/index.cjs'));

    expect(typeof root.LilySdk).toBe('function');
    expect(typeof root.AgentClient).toBe('function');
    expect(typeof root.WalletClient).toBe('function');
    expect(typeof root.PaymentClient).toBe('function');
    expect(typeof root.IdentityClient).toBe('function');
    expect(typeof root.SystemClient).toBe('function');
    expect(typeof root.BaseClient).toBe('function');
    expect(typeof root.createFetchHttpClient).toBe('function');
    expect(typeof root.resolveLilySdkConfig).toBe('function');
    expect(typeof root.normalizeMoneyAmount).toBe('function');
    expect(typeof root.SDK_VERSION).toBe('string');
    expect(typeof root.isLilySdkError).toBe('function');

    expect(root.LILY_ERROR_CODES).toBeDefined();
    expect(root.LilySdkError).toBeDefined();
    expect(root.LilyConfigError).toBeDefined();
    expect(root.LilyApiError).toBeDefined();
    expect(root.LilyAuthenticationError).toBeDefined();
    expect(root.LilyAuthorizationError).toBeDefined();
    expect(root.LilyConflictError).toBeDefined();
    expect(root.LilyNotFoundError).toBeDefined();
    expect(root.LilyRateLimitError).toBeDefined();
    expect(root.LilyServerError).toBeDefined();
    expect(root.LilyTransportError).toBeDefined();
    expect(root.LilyValidationError).toBeDefined();
  });
});
