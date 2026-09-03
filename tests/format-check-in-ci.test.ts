import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #85 — $20
 * "Enforce `npm run format:check` in CI"
 *
 * Verifies that the CI workflow runs prettier format:check.
 */
describe('format:check in CI', () => {
  const ciPath = resolve(process.cwd(), '.github/workflows');
  const files = ['ci.yml', 'main.yml', 'test.yml', 'publish.yml'];

  function getCiContent(): string | null {
    for (const file of files) {
      const fullPath = resolve(ciPath, file);
      try {
        const content = readFileSync(fullPath, 'utf8');
        return content;
      } catch {
        // try next file
      }
    }
    return null;
  }

  it('has a CI workflow file', () => {
    const content = getCiContent();
    expect(content).not.toBeNull();
  });

  it('CI runs npm run format:check', () => {
    const content = getCiContent();
    expect(content).toContain('format:check');
    expect(content).toContain('npm run format:check');
  });
});
