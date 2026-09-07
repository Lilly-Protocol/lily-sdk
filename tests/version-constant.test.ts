import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #71 — $40
 * "Export a package version constant and `LilySdk.version`"
 *
 * Verifies that the package version is exported and accessible.
 */
describe('LilySdk version constant', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as { version: string };

  it('package.json has a semver version', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('version is a string', () => {
    expect(typeof pkg.version).toBe('string');
  });

  it('version is not "0.0.0"', () => {
    expect(pkg.version).not.toBe('0.0.0');
  });

  it('version has exactly 3 dot-separated parts', () => {
    expect(pkg.version.split('.')).toHaveLength(3);
  });

  it('version parts are all numeric', () => {
    for (const part of pkg.version.split('.')) {
      expect(Number.isInteger(Number(part))).toBe(true);
      expect(Number(part)).toBeGreaterThanOrEqual(0);
    }
  });
});
