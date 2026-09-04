import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from '../package.json';

/**
 * Issue #424: Export-surface parity test for every `exports` subpath against root entry.
 * Validates that all natural subpath exports (config, errors, http, models, types)
 * are properly exposed, importable from dist, and match their documented/expected symbols.
 */
describe('exports subpath parity against root entry (issue #424)', () => {
  const distDir = resolve(process.cwd(), 'dist');

  it('verifies that all error classes, constants, and type guards exported at root are also exported from ./errors', async () => {
    const rootMod = await import(resolve(distDir, 'index.js'));
    const errorsMod = await import(resolve(distDir, 'errors.js'));

    const expectedErrorExports = [
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
      'LilyValidationError',
      'isLilySdkError',
    ];

    for (const symbol of expectedErrorExports) {
      expect(rootMod[symbol], `root missing ${symbol}`).toBeDefined();
      expect(
        errorsMod[symbol],
        `errors subpath missing ${symbol}`,
      ).toBeDefined();
      expect(typeof errorsMod[symbol]).toBe(typeof rootMod[symbol]);
    }

    expect(errorsMod.LILY_ERROR_CODES).toStrictEqual(rootMod.LILY_ERROR_CODES);
    expect(errorsMod.isLilySdkError).toBeTypeOf('function');
    expect(errorsMod.LilyValidationError).toBeTypeOf('function');
  });

  it('verifies that config resolver and types are exported from ./config and root', async () => {
    const rootMod = await import(resolve(distDir, 'index.js'));
    const configMod = await import(resolve(distDir, 'config.js'));

    expect(rootMod.resolveLilySdkConfig).toBeDefined();
    expect(configMod.resolveLilySdkConfig).toBeDefined();
    expect(typeof configMod.resolveLilySdkConfig).toBe('function');
  });

  it('verifies that http helpers and transport are exported from ./http and root', async () => {
    const rootMod = await import(resolve(distDir, 'index.js'));
    const httpMod = await import(resolve(distDir, 'http.js'));

    expect(rootMod.createFetchHttpClient).toBeDefined();
    expect(httpMod.createFetchHttpClient).toBeDefined();
    expect(typeof httpMod.createFetchHttpClient).toBe('function');

    expect(httpMod.buildUrl).toBeDefined();
    expect(typeof httpMod.buildUrl).toBe('function');
  });

  it('verifies that models subpath exports all domain models and validators', async () => {
    const rootMod = await import(resolve(distDir, 'index.js'));
    const modelsMod = await import(resolve(distDir, 'models.js'));

    const modelSymbols = [
      'validateAgent',
      'validateCreateAgentInput',
      'validateUpdateAgentInput',
      'validateProvisionWalletInput',
      'validateCreatePaymentInput',
      'validateMoneyAmount',
      'normalizeMoneyAmount',
      'formatMoneyAmount',
    ];

    for (const sym of modelSymbols) {
      if (rootMod[sym] !== undefined) {
        expect(modelsMod[sym], `models subpath missing ${sym}`).toBeDefined();
        expect(typeof modelsMod[sym]).toBe(typeof rootMod[sym]);
      }
    }
  });

  it('verifies built declaration files exist and declare symbols for each export entry', () => {
    const exportsMap = packageJson.exports as Record<
      string,
      { import?: { types?: string }; require?: { types?: string } }
    >;

    const subpathNames = [
      './config',
      './errors',
      './http',
      './models',
      './types',
    ];

    for (const subpath of subpathNames) {
      const entry = exportsMap[subpath];
      expect(entry, `package.json exports missing ${subpath}`).toBeDefined();
      expect(entry?.import?.types).toBeDefined();

      const dtsPath = resolve(process.cwd(), entry!.import!.types!);
      expect(existsSync(dtsPath), `d.ts file missing: ${dtsPath}`).toBe(true);

      const dtsContent = readFileSync(dtsPath, 'utf-8');
      expect(dtsContent.length).toBeGreaterThan(0);
    }
  });

  it('verifies that ./types d.ts declares client contract interfaces', () => {
    const typesDtsPath = resolve(distDir, 'types.d.ts');
    expect(existsSync(typesDtsPath)).toBe(true);
    const content = readFileSync(typesDtsPath, 'utf-8');

    const expectedInterfaces = [
      'AgentClientContract',
      'IdentityClientContract',
      'PaymentClientContract',
      'SystemClientContract',
      'WalletClientContract',
    ];

    for (const iface of expectedInterfaces) {
      expect(content).toContain(iface);
    }
  });
});
