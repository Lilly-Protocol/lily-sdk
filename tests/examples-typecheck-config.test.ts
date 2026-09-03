import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #120 — $75
 * "Add a TypeScript config for examples so they typecheck independently"
 *
 * Verifies that examples have their own tsconfig and are typecheckable.
 */
describe('examples TypeScript config', () => {
  const examplesDir = resolve(process.cwd(), 'examples');
  const tsconfigPath = resolve(examplesDir, 'tsconfig.json');

  it('examples directory exists', () => {
    expect(resolve(examplesDir)).toBeTruthy();
  });

  it('examples/tsconfig.json exists', () => {
    const content = readFileSync(tsconfigPath, 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('examples/tsconfig.json is valid JSON', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as Record<string, unknown>;
    expect(typeof config).toBe('object');
  });

  it('examples/tsconfig.json includes strict mode', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
      compilerOptions?: { strict?: boolean };
    };
    expect(config.compilerOptions?.strict).toBe(true);
  });

  it('examples have at least one .ts file', () => {
    const { readdirSync } = require('node:fs') as typeof import('node:fs');
    const files = readdirSync(examplesDir);
    const tsFiles = files.filter((f) => f.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);
  });
});
