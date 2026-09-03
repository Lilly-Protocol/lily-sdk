import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #96 — $45
 * "Add a tree-shaking verification test for `sideEffects: false`"
 *
 * Verifies that `sideEffects` is set to `false` in package.json,
 * enabling bundlers to safely tree-shake unused exports.
 */
describe('tree-shaking: sideEffects verification', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as { sideEffects: boolean | string[] };

  it('sideEffects is set to false', () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it('sideEffects is not an array (fully side-effect-free)', () => {
    expect(Array.isArray(pkg.sideEffects)).toBe(false);
  });

  it('sideEffects is not undefined', () => {
    expect(pkg.sideEffects).toBeDefined();
  });

  it('sideEffects is not true', () => {
    expect(pkg.sideEffects).not.toBe(true);
  });
});
