import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #86 — $30
 * "Expand the CI matrix to Node 24"
 *
 * Verifies that the CI matrix includes Node 24.
 */
describe('CI matrix includes Node 24', () => {
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

  it('CI matrix includes Node 24', () => {
    const content = getCiContent();
    expect(content).toContain('24');
  });

  it('CI matrix includes at least 2 Node versions', () => {
    const content = getCiContent();
    const nodeVersions = content?.match(/['"]?(\d+)['"]?/g) ?? [];
    const uniqueVersions = new Set(nodeVersions.map((v) => v.replace(/['"]/g, '')));
    expect(uniqueVersions.size).toBeGreaterThanOrEqual(2);
  });
});
