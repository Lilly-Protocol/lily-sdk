import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import pkg from '../package.json';

const require = createRequire(import.meta.url);
const root = join(__dirname, '..');

describe('package exports resolve to real files', () => {
  const exportEntries = Object.entries(pkg.exports).filter(
    ([key]) => key !== './package.json',
  );

  it.each(exportEntries)('%s resolves via require()', (_subpath, value: Record<string, string> | string) => {
    if (typeof value === 'string') return;
    const entry = value.require ?? value.import;
    if (!entry) return;
    const resolved = require.resolve(join(root, entry));
    expect(existsSync(resolved)).toBe(true);
  });

  it.each(exportEntries)('%s has a non-empty type declaration', (_subpath, value: Record<string, string> | string) => {
    if (typeof value === 'string') return;
    const typesPath = value.types;
    if (!typesPath) return;
    const full = join(root, typesPath);
    expect(existsSync(full)).toBe(true);
    const content = readFileSync(full, 'utf8').trim();
    expect(content.length).toBeGreaterThan(0);
  });
});
