import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from '../package.json';

describe('package exports subpaths', () => {
  const exportsMap = packageJson.exports as Record<string, Record<string, string> | string>;

  const subpaths = Object.keys(exportsMap).filter((key) => key !== './package.json');

  for (const subpath of subpaths) {
    it(`${subpath} resolves to existing files with type declarations`, () => {
      const entry = exportsMap[subpath];
      if (!entry) return;

      if (typeof entry === 'string') {
        const filePath = resolve(__dirname, '..', entry);
        expect(existsSync(filePath), `Missing file for ${subpath}: ${entry}`).toBe(true);
        return;
      }

      // Verify types declaration exists and is non-empty
      if ('types' in entry && entry.types) {
        const typesPath = resolve(__dirname, '..', entry.types);
        expect(existsSync(typesPath), `Missing types for ${subpath}: ${entry.types}`).toBe(true);
      }

      // Verify import condition
      if ('import' in entry && entry.import) {
        const importPath = resolve(__dirname, '..', entry.import);
        expect(existsSync(importPath), `Missing import for ${subpath}: ${entry.import}`).toBe(true);
      }

      // Verify require condition
      if ('require' in entry && entry.require) {
        const requirePath = resolve(__dirname, '..', entry.require);
        expect(existsSync(requirePath), `Missing require for ${subpath}: ${entry.require}`).toBe(true);
      }
    });
  }
});
