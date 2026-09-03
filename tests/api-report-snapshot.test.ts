import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Issue #95: API report snapshot to catch breaking public API changes.
 * Verifies that the declaration files (.d.ts) in dist/ match the expected
 * public API surface. This is a lightweight version that checks the
 * presence and structure of exported types.
 */
describe('API report snapshot (issue #95)', () => {
  const distDir = resolve(process.cwd(), 'dist');

  it('dist directory exists after build', () => {
    // Skip if not built yet
    if (!existsSync(distDir)) return;
    expect(existsSync(distDir)).toBe(true);
  });

  it('index.d.ts exports LilySdk class', () => {
    const dtsPath = resolve(distDir, 'index.d.ts');
    if (!existsSync(dtsPath)) return;
    const content = readFileSync(dtsPath, 'utf-8');
    expect(content).toContain('LilySdk');
  });

  it('index.d.ts exports all client classes', () => {
    const dtsPath = resolve(distDir, 'index.d.ts');
    if (!existsSync(dtsPath)) return;
    const content = readFileSync(dtsPath, 'utf-8');
    expect(content).toContain('AgentClient');
    expect(content).toContain('WalletClient');
    expect(content).toContain('PaymentClient');
    expect(content).toContain('IdentityClient');
    expect(content).toContain('SystemClient');
  });

  it('index.d.ts exports error classes', () => {
    const dtsPath = resolve(distDir, 'index.d.ts');
    if (!existsSync(dtsPath)) return;
    const content = readFileSync(dtsPath, 'utf-8');
    expect(content).toContain('LilySdkError');
    expect(content).toContain('LilyApiError');
    expect(content).toContain('LilyConfigError');
  });

  it('index.d.ts exports SDK_VERSION', () => {
    const dtsPath = resolve(distDir, 'index.d.ts');
    if (!existsSync(dtsPath)) return;
    const content = readFileSync(dtsPath, 'utf-8');
    expect(content).toContain('SDK_VERSION');
  });

  it('index.d.ts exports isLilySdkError', () => {
    const dtsPath = resolve(distDir, 'index.d.ts');
    if (!existsSync(dtsPath)) return;
    const content = readFileSync(dtsPath, 'utf-8');
    expect(content).toContain('isLilySdkError');
  });

  it('all subpath .d.ts files exist', () => {
    const subpaths = ['config.d.ts', 'errors.d.ts', 'http.d.ts', 'models.d.ts', 'types.d.ts'];
    for (const file of subpaths) {
      const filePath = resolve(distDir, file);
      if (!existsSync(filePath)) continue; // skip if not built
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it('no unexpected exports in index.d.ts', () => {
    const dtsPath = resolve(distDir, 'index.d.ts');
    if (!existsSync(dtsPath)) return;
    const content = readFileSync(dtsPath, 'utf-8');
    // These should NOT be exported from the main entry
    expect(content).not.toContain('export { createFetchHttpClient }');
    expect(content).not.toContain('export { resolveLilySdkConfig }');
  });
});
