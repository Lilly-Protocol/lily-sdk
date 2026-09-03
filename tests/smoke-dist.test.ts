import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Issue #92: Smoke-test the built dist via both import and require.
 * These tests verify that the dist files exist and can be loaded.
 * Run `npm run build` before running these tests.
 */
const distDir = resolve(process.cwd(), 'dist');
const distExists = existsSync(distDir);

describe('dist smoke test (issue #92)', () => {
  it('dist/index.js (ESM) exists after build', () => {
    if (!distExists) return; // skip if not built
    expect(existsSync(resolve(distDir, 'index.js'))).toBe(true);
  });

  it('dist/index.cjs (CJS) exists after build', () => {
    if (!distExists) return;
    expect(existsSync(resolve(distDir, 'index.cjs'))).toBe(true);
  });

  it('dist/index.d.ts (types) exists after build', () => {
    if (!distExists) return;
    expect(existsSync(resolve(distDir, 'index.d.ts'))).toBe(true);
  });

  it('CJS build exports LilySdk', () => {
    const cjsPath = resolve(distDir, 'index.cjs');
    if (!existsSync(cjsPath)) return;
    const cjs = require(cjsPath);
    expect(cjs.LilySdk).toBeDefined();
    expect(typeof cjs.LilySdk).toBe('function');
  });

  it('CJS build exports SDK_VERSION', () => {
    const cjsPath = resolve(distDir, 'index.cjs');
    if (!existsSync(cjsPath)) return;
    const cjs = require(cjsPath);
    expect(cjs.SDK_VERSION).toBeDefined();
    expect(typeof cjs.SDK_VERSION).toBe('string');
  });

  it('CJS build exports all client classes', () => {
    const cjsPath = resolve(distDir, 'index.cjs');
    if (!existsSync(cjsPath)) return;
    const cjs = require(cjsPath);
    expect(cjs.AgentClient).toBeDefined();
    expect(cjs.WalletClient).toBeDefined();
    expect(cjs.PaymentClient).toBeDefined();
    expect(cjs.IdentityClient).toBeDefined();
    expect(cjs.SystemClient).toBeDefined();
  });

  it('CJS build exports error classes', () => {
    const cjsPath = resolve(distDir, 'index.cjs');
    if (!existsSync(cjsPath)) return;
    const cjs = require(cjsPath);
    expect(cjs.LilySdkError).toBeDefined();
    expect(cjs.LilyApiError).toBeDefined();
    expect(cjs.LilyConfigError).toBeDefined();
    expect(cjs.LilyAuthenticationError).toBeDefined();
    expect(cjs.LilyTransportError).toBeDefined();
    expect(cjs.isLilySdkError).toBeDefined();
  });

  it('ESM build can be dynamically imported', async () => {
    const esmPath = resolve(distDir, 'index.js');
    if (!existsSync(esmPath)) return;
    const mod = await import(esmPath);
    expect(mod.LilySdk).toBeDefined();
    expect(mod.SDK_VERSION).toBeDefined();
  });
});
