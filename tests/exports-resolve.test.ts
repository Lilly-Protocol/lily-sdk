import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgPath = resolve(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { exports: Record<string, unknown> };

describe('package exports subpaths', () => {
  const exportEntries = Object.entries(pkg.exports).filter(
    ([key]) => key !== './package.json',
  );

  for (const [subpath, conditions] of exportEntries) {
    it(`${subpath} resolves to existing files with type declarations`, () => {
      if (typeof conditions === 'string') {
        const filePath = resolve(__dirname, '..', conditions);
        expect(() => require.resolve(filePath)).not.toThrow();
        return;
      }

      const condMap = conditions as Record<string, string>;
      for (const [condition, relativePath] of Object.entries(condMap)) {
        const filePath = resolve(__dirname, '..', relativePath);
        expect(() => require.resolve(filePath)).not.toThrow();

        if (condition === 'types') {
          expect(relativePath).toMatch(/\.d\.(ts|cts)$/);
        }
      }
    });
  }
});
