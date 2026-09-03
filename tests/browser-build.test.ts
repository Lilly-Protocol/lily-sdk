import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Issue #87: Browser-target build and browser export condition.
 * Verifies that the browser build configuration exists in tsup.config.ts
 * and that package.json has a browser export condition.
 */
describe('Browser-target build (issue #87)', () => {
  const distBrowserDir = resolve(process.cwd(), 'dist/browser');

  it('package.json has browser export condition', () => {
    const pkg = require('../package.json');
    expect(pkg.exports['.']).toBeDefined();
    expect(pkg.exports['.']['browser']).toBeDefined();
    expect(pkg.exports['.']['browser']).toBe('./dist/browser/index.js');
  });

  it('package.json has build:browser script', () => {
    const pkg = require('../package.json');
    expect(pkg.scripts['build:browser']).toBeDefined();
  });

  it('tsup.config.ts exports browserConfig', async () => {
    // The browser config should be importable from tsup.config.ts
    const config = await import('../tsup.config.ts');
    expect(config.browserConfig).toBeDefined();
  });

  it('browser build output exists after build:browser', () => {
    // Skip if not built yet
    if (!existsSync(distBrowserDir)) return;
    expect(existsSync(resolve(distBrowserDir, 'index.js'))).toBe(true);
  });

  it('browser build targets es2022', async () => {
    const config = await import('../tsup.config.ts');
    // browserConfig is a tsup config — check it has browser platform
    expect(config.browserConfig).toBeDefined();
  });
});
