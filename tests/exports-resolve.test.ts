import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgPath = resolve(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  exports: Record<string, unknown>;
};

interface ResolvedFile {
  condition: string;
  path: string;
}

function collectConditionalFiles(
  value: unknown,
  condition: string,
  into: ResolvedFile[],
) {
  if (typeof value === 'string') {
    into.push({ condition, path: value });
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      collectConditionalFiles(nested, key, into);
    }
  }
}

describe('package exports subpaths', () => {
  const exportEntries = Object.entries(pkg.exports).filter(
    ([key]) => key !== './package.json',
  );

  for (const [subpath, conditions] of exportEntries) {
    it(`${subpath} resolves to existing files with type declarations`, () => {
      const files: ResolvedFile[] = [];
      collectConditionalFiles(conditions, 'root', files);

      expect(files.length).toBeGreaterThan(0);
      for (const { path } of files) {
        const filePath = resolve(__dirname, '..', path);
        expect(() => require.resolve(filePath)).not.toThrow();
      }

      const typeDeclarations = files.filter(({ path }) =>
        /\.d\.(?:ts|cts)$/u.test(path),
      );
      expect(typeDeclarations.length).toBeGreaterThan(0);
    });
  }
});
