import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #91 — $50
 * "Pin `packageManager` and `engines.npm` for reproducible builds"
 *
 * Verifies that package.json pins the package manager and npm engine.
 */
describe('packageManager and engines.npm pinning', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as {
    packageManager?: string;
    engines?: { node?: string; npm?: string };
  };

  it('has a packageManager field', () => {
    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^npm@\d+\.\d+\.\d+/);
  });

  it('has engines.npm defined', () => {
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines?.npm).toBeDefined();
    expect(pkg.engines?.npm).toMatch(/\d+\.\d+\.\d+/);
  });

  it('has engines.node defined', () => {
    expect(pkg.engines?.node).toBeDefined();
    expect(pkg.engines?.node).toMatch(/\d+/);
    expect(pkg.engines?.node).toContain('20');
  });

  it('packageManager is compatible with engines.npm', () => {
    const pmVersion = pkg.packageManager?.replace('npm@', '') ?? '';
    const npmRange = pkg.engines?.npm ?? '';
    if (npmRange.startsWith('>=')) {
      const minVersion = npmRange.replace('>=', '').split('.')[0];
      const pmMajor = pmVersion.split('.')[0];
      expect(parseInt(pmMajor)).toBeGreaterThanOrEqual(parseInt(minVersion));
    }
  });
});
