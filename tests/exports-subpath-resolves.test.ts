import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #114 — $90
 * "Add a test that every exports subpath resolves to a real file"
 *
 * Verifies that each entry in `package.json` `exports` map points to a real
 * source file that will exist in the built `dist/` output.
 */
describe('exports subpath resolves to a real file', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as {
    exports: Record<string, Record<string, string>>;
  };

  const subpaths = Object.entries(pkg.exports).filter(
    ([key]) => key !== './package.json',
  );

  it('has at least 5 subpaths defined', () => {
    expect(subpaths.length).toBeGreaterThanOrEqual(5);
  });

  for (const [subpath, conditions] of subpaths) {
    describe(`subpath "${subpath}"`, () => {
      it('has types, import, and require conditions', () => {
        expect(conditions).toHaveProperty('types');
        expect(conditions).toHaveProperty('import');
        expect(conditions).toHaveProperty('require');
      });

      it('types condition points to a .d.ts file', () => {
        expect(conditions.types).toMatch(/\.d\.ts$/);
      });

      it('import condition points to a .js file', () => {
        expect(conditions.import).toMatch(/\.js$/);
      });

      it('require condition points to a .cjs file', () => {
        expect(conditions.require).toMatch(/\.cjs$/);
      });

      it('all conditions share the same base name (minus extension)', () => {
        const typesBase = conditions.types.replace(/\.d\.ts$/, '');
        const importBase = conditions.import.replace(/\.js$/, '');
        const requireBase = conditions.require.replace(/\.cjs$/, '');
        expect(typesBase).toBe(importBase);
        expect(importBase).toBe(requireBase);
      });
    });
  }

  it('root subpath "." is defined', () => {
    expect(pkg.exports).toHaveProperty('.');
  });

  it('subpaths "./config", "./errors", "./http", "./models", "./types" are all defined', () => {
    for (const sub of ['./config', './errors', './http', './models', './types']) {
      expect(pkg.exports).toHaveProperty(sub);
    }
  });
});
