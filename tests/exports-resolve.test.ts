import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

import pkg from '../package.json';

const require = createRequire(import.meta.url);
const rootDir = resolve(__dirname, '..');

describe('package exports subpath resolution', () => {
  const exportsMap = pkg.exports as Record<string, unknown>;

  const subpaths = Object.keys(exportsMap).filter(
    (k) => k !== './package.json',
  );

  for (const subpath of subpaths) {
    it(`${subpath} resolves to an existing file with type declarations`, () => {
      const entry = exportsMap[subpath] as Record<string, string>;
      if (!entry || typeof entry !== 'object') {
        throw new Error(`Unexpected exports entry for ${subpath}`);
      }

      const esmFile = entry.import!;
      const cjsFile = entry.require!;
      const typesFile = entry.types!;

      const esmPath = resolve(rootDir, esmFile);
      expect(existsSync(esmPath), `ESM file missing: ${esmFile}`).toBe(true);

      const cjsPath = resolve(rootDir, cjsFile);
      expect(existsSync(cjsPath), `CJS file missing: ${cjsFile}`).toBe(true);

      const typesPath = resolve(rootDir, typesFile);
      expect(existsSync(typesPath), `Types file missing: ${typesFile}`).toBe(
        true,
      );
      const typesContent = readFileSync(typesPath, 'utf-8');
      expect(
        typesContent.trim().length,
        `Types file empty: ${typesFile}`,
      ).toBeGreaterThan(0);

      if (entry.default) {
        const defaultPath = resolve(rootDir, entry.default);
        expect(
          existsSync(defaultPath),
          `Default file missing: ${entry.default}`,
        ).toBe(true);
      }

      expect(() => require(cjsPath)).not.toThrow();
    });
  }
});
