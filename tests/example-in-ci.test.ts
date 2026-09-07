import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #93 — $20
 * "Run `npm run example` against a local server in CI"
 *
 * Verifies that the CI workflow includes an example run step.
 */
describe('npm run example in CI', () => {
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

  it('CI runs npm run example', () => {
    const content = getCiContent();
    expect(content).toContain('npm run example');
  });

  it('package.json has an example script', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts).toHaveProperty('example');
    expect(pkg.scripts.example).toContain('tsx');
  });
});
