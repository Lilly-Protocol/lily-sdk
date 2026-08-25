import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

interface ConditionalExport {
  types: string;
  import: string;
  require: string;
}

interface PackageJson {
  name: string;
  main: string;
  module: string;
  types: string;
  exports: Record<string, ConditionalExport | string>;
}

const packageRoot = new URL('../', import.meta.url);
const packageJson = JSON.parse(
  await readFile(new URL('package.json', packageRoot), 'utf8'),
) as PackageJson;
const require = createRequire(import.meta.url);

async function expectFile(target: string): Promise<void> {
  const targetUrl = new URL(target, packageRoot);
  const targetStat = await stat(targetUrl);

  expect(targetStat.isFile(), `${target} should be a file`).toBe(true);
}

async function expectNonEmptyDeclaration(target: string): Promise<void> {
  expect(target).toMatch(/\.d\.(?:ts|cts)$/u);
  await expectFile(target);
  await expect(readFile(new URL(target, packageRoot), 'utf8')).resolves.toMatch(
    /\S/u,
  );
}

describe('package entry points', () => {
  it('resolves the top-level main, module, and types files', async () => {
    await expectFile(packageJson.main);
    await expectFile(packageJson.module);
    await expectNonEmptyDeclaration(packageJson.types);

    await import(new URL(packageJson.module, packageRoot).href);
    expect(() =>
      require(fileURLToPath(new URL(packageJson.main, packageRoot))),
    ).not.toThrow();
  });

  for (const [subpath, entry] of Object.entries(packageJson.exports)) {
    it(`resolves the ${subpath} export`, async () => {
      if (typeof entry === 'string') {
        await expectFile(entry);
        return;
      }

      await expectFile(entry.import);
      await expectFile(entry.require);
      await expectNonEmptyDeclaration(entry.types);

      const specifier =
        subpath === '.'
          ? packageJson.name
          : `${packageJson.name}/${subpath.slice(2)}`;

      await import(specifier);
      expect(() => require(specifier)).not.toThrow();
    });
  }
});
