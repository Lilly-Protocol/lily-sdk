import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface FormatConditions {
  types?: string;
  default?: string;
}

interface SubpathEntry {
  import?: FormatConditions;
  require?: FormatConditions;
}

describe('Tarball subpath smoke (issue #84)', () => {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
  );
  const exports = (pkg.exports || {}) as Record<string, unknown>;
  const subpathEntries = Object.entries(exports).filter(
    ([subpath, entry]) =>
      subpath !== '.' && typeof entry === 'object' && entry !== null,
  ) as Array<[string, SubpathEntry]>;

  it('package.json has exports map', () => {
    expect(Object.keys(exports).length).toBeGreaterThan(0);
  });

  it('every subpath has import and require conditions with types', () => {
    for (const [, entry] of subpathEntries) {
      expect(entry.import).toBeDefined();
      expect(entry.require).toBeDefined();
      expect(entry.import?.types).toBeDefined();
      expect(entry.require?.types).toBeDefined();
    }
  });

  it('every subpath import types points to .d.ts', () => {
    for (const [, entry] of subpathEntries) {
      expect(entry.import?.types).toMatch(/\.d\.ts$/);
    }
  });

  it('every subpath import points to .js', () => {
    for (const [, entry] of subpathEntries) {
      expect(entry.import?.default).toMatch(/\.js$/);
    }
  });

  it('every subpath require points to .cjs with .d.cts types', () => {
    for (const [, entry] of subpathEntries) {
      expect(entry.require?.default).toMatch(/\.cjs$/);
      expect(entry.require?.types).toMatch(/\.d\.cts$/);
    }
  });
});
