import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #435 — $75
 * "Build the typedoc API docs in CI"
 *
 * Verifies that the CI workflow builds typedoc API docs and verifies
 * that generated artifacts remain clean and synchronized.
 */
describe('typedoc API docs in CI', () => {
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

  it('CI workflow contains a docs job', () => {
    const content = getCiContent();
    expect(content).toMatch(/docs:\s*\n\s+runs-on:/);
  });

  it('CI workflow runs npm run build and npm run docs', () => {
    const content = getCiContent();
    expect(content).toContain('npm run build');
    expect(content).toContain('npm run docs');
  });

  it('CI workflow checks for uncommitted docs diff', () => {
    const content = getCiContent();
    expect(content).toContain('git status --porcelain docs/api');
    expect(content).toContain('git diff docs/api');
  });

  it('package.json has a docs script with typedoc', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts).toHaveProperty('docs');
    expect(pkg.scripts.docs).toContain('typedoc');
    expect(pkg.scripts.docs).toContain('docs/api');
  });
});
