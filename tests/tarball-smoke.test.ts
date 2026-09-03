import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Tarball subpath smoke (issue #84)', () => {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
  const exports = pkg.exports || {};
  const subpathEntries = Object.entries(exports).filter(([k, v]) => k !== '.' && typeof v === 'object');

  it('package.json has exports map', () => {
    expect(Object.keys(exports).length).toBeGreaterThan(0);
  });

  it('every subpath has types condition', () => {
    for (const [key, conditions] of subpathEntries) {
      const exp = conditions as Record<string, string>;
      expect(exp).toHaveProperty('types');
    }
  });

  it('every subpath has import condition', () => {
    for (const [key, conditions] of subpathEntries) {
      const exp = conditions as Record<string, string>;
      expect(exp).toHaveProperty('import');
    }
  });

  it('every subpath has require condition', () => {
    for (const [key, conditions] of subpathEntries) {
      const exp = conditions as Record<string, string>;
      expect(exp).toHaveProperty('require');
    }
  });

  it('every subpath types points to .d.ts', () => {
    for (const [key, conditions] of subpathEntries) {
      const exp = conditions as Record<string, string>;
      expect(exp.types).toMatch(/\.d\.ts$/);
    }
  });

  it('every subpath import points to .js', () => {
    for (const [key, conditions] of subpathEntries) {
      const exp = conditions as Record<string, string>;
      expect(exp.import).toMatch(/\.js$/);
    }
  });
});
