import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #80 — $45
 * "Add `publishConfig.access: public` to `package.json`"
 *
 * Verifies that the package is configured for public npm publishing.
 */
describe('publishConfig.access: public', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as {
    publishConfig?: { access?: string };
  };

  it('has publishConfig defined', () => {
    expect(pkg.publishConfig).toBeDefined();
  });

  it('has publishConfig.access set to "public"', () => {
    expect(pkg.publishConfig?.access).toBe('public');
  });
});
