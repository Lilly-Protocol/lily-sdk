import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('package exports contract', () => {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  function collectLeafPaths(value: unknown, into: string[]) {
    if (typeof value === 'string') {
      into.push(value);
    } else if (value && typeof value === 'object') {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        collectLeafPaths(nested, into);
      }
    }
  }

  it('declares subpaths in exports that map to corresponding source files', () => {
    const exportsMap = packageJson.exports as Record<string, unknown>;

    expect(exportsMap).toBeDefined();

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (subpath === './package.json') {
        expect(target).toBe('./package.json');
        continue;
      }

      // Verify source module counterpart exists in src/
      const moduleName =
        subpath === '.' ? 'index' : subpath.replace(/^\.\//, '');
      const srcFile = path.resolve(__dirname, `../src/${moduleName}.ts`);
      expect(
        fs.existsSync(srcFile),
        `Expected source file ${srcFile} to exist for export ${subpath}`,
      ).toBe(true);

      // Verify every declared output file is under dist/
      const outputFiles: string[] = [];
      collectLeafPaths(target, outputFiles);
      expect(outputFiles.length).toBeGreaterThan(0);
      for (const outputFile of outputFiles) {
        expect(outputFile.startsWith('./dist/')).toBe(true);
      }
    }
  });

  it('declares top-level main, module, and types fields pointing to dist/index', () => {
    expect(packageJson.main).toBe('./dist/index.cjs');
    expect(packageJson.module).toBe('./dist/index.js');
    expect(packageJson.types).toBe('./dist/index.d.ts');
  });
});
