import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from '../package.json';

describe('package exports subpaths', () => {
  const exportsMap = packageJson.exports as unknown as Record<string, unknown>;

  const subpaths = Object.keys(exportsMap).filter(
    (key) => key !== './package.json',
  );

  function collectPaths(value: unknown, into: string[]) {
    if (typeof value === 'string') {
      into.push(value);
    } else if (value && typeof value === 'object') {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        collectPaths(nested, into);
      }
    }
  }

  for (const subpath of subpaths) {
    it(`${subpath} resolves to existing files with type declarations`, () => {
      const entry = exportsMap[subpath];
      if (!entry) return;

      const paths: string[] = [];
      collectPaths(entry, paths);

      expect(paths.length).toBeGreaterThan(0);
      for (const file of paths) {
        const filePath = resolve(__dirname, '..', file);
        expect(
          existsSync(filePath),
          `Missing file for ${subpath}: ${file}`,
        ).toBe(true);
      }

      const typeDeclarations = paths.filter((file) =>
        /\.d\.(?:ts|cts)$/u.test(file),
      );
      expect(
        typeDeclarations.length,
        `${subpath} declares at least one type file`,
      ).toBeGreaterThan(0);
    });
  }
});
