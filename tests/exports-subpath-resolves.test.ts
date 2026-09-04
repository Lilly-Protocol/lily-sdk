import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface FormatConditions {
  types: string;
  default: string;
}

interface ConditionalExport {
  browser?: string;
  import: FormatConditions;
  require: FormatConditions;
}

const pkg = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'),
) as {
  exports: Record<string, ConditionalExport | string>;
};

const dist = resolve(process.cwd(), 'dist');
const entries = Object.entries(pkg.exports).filter(
  (entry): entry is [string, ConditionalExport] => typeof entry[1] !== 'string',
);

function existsWithinDist(file: string, label: string) {
  const target = resolve(process.cwd(), file);
  const normalizedTarget = target.replace(/\\/g, '/');
  const normalizedDist = dist.replace(/\\/g, '/');
  expect(normalizedTarget.startsWith(`${normalizedDist}/`), `${label} must live under dist/`).toBe(
    true,
  );
  expect(
    readFileSync(target, 'utf8').length,
    `${file} should not be empty`,
  ).toBeGreaterThan(0);
}

describe('subpath exports resolve to dual-format builds', () => {
  it('provides a types, import, and require condition for every subpath', () => {
    expect(entries.length).toBeGreaterThanOrEqual(6);
    for (const [subpath, entry] of entries) {
      expect(entry.import, `${subpath} has an import condition`).toBeDefined();
      expect(entry.require, `${subpath} has a require condition`).toBeDefined();
      expect(entry.import.types).toBeTruthy();
      expect(entry.require.types).toBeTruthy();
    }
  });

  it('resolves ESM and CJS entry files for each subpath', () => {
    for (const [subpath, entry] of entries) {
      existsWithinDist(entry.import.default, `${subpath} import.default`);
      existsWithinDist(entry.require.default, `${subpath} require.default`);
    }
  });

  it('resolves the type declaration files for each subpath', () => {
    for (const [subpath, entry] of entries) {
      expect(entry.import.types).toMatch(/\.d\.ts$/u);
      expect(entry.require.types).toMatch(/\.d\.cts$/u);
      existsWithinDist(entry.import.types, `${subpath} import.types`);
      existsWithinDist(entry.require.types, `${subpath} require.types`);
    }
  });

  it('points each ESM and CJS file at a matching output basename', () => {
    for (const [, entry] of entries) {
      const bases = [
        entry.import.default,
        entry.import.types,
        entry.require.default,
        entry.require.types,
      ].map((file) =>
        file
          .replace(/^.*\//, '')
          .replace(/\.d\.cts$/u, '')
          .replace(/\.d\.ts$/u, '')
          .replace(/\.cjs$/u, '')
          .replace(/\.js$/u, ''),
      );

      expect(
        new Set(bases).size,
        `${JSON.stringify(bases)} share one basename`,
      ).toBe(1);
    }
  });
});
