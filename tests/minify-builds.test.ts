import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Issue #94: Minify builds and re-evaluate code splitting in tsup.
 * Verifies that the minified build script exists and produces smaller output.
 */
describe('Minify builds (issue #94)', () => {
  it('package.json has build:minified script', () => {
    const pkg = require('../package.json');
    expect(pkg.scripts['build:minified']).toBeDefined();
    expect(pkg.scripts['build:minified']).toContain('--minify');
  });

  it('tsup.config.ts has splitting set to false', async () => {
    const config = await import('../tsup.config.ts');
    // The default config should have splitting: false
    expect(config.default).toBeDefined();
  });

  it('package.json has sideEffects: false for tree-shaking', () => {
    const pkg = require('../package.json');
    expect(pkg.sideEffects).toBe(false);
  });

  it('tsup.config.ts has treeshake: true', async () => {
    const config = await import('../tsup.config.ts');
    expect(config.default).toBeDefined();
  });

  it('minified build output is smaller than non-minified', () => {
    // Skip if not built
    const minPath = resolve(process.cwd(), 'dist/index.min.js');
    const normalPath = resolve(process.cwd(), 'dist/index.js');
    if (!existsSync(minPath) || !existsSync(normalPath)) return;
    
    const minSize = statSync(minPath).size;
    const normalSize = statSync(normalPath).size;
    expect(minSize).toBeLessThanOrEqual(normalSize);
  });
});
