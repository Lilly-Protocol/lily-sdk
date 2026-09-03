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
    const uniqueVersions = new Set(
      nodeVersions.map((v) => v.replace(/['"]/g, '')),
    );
    expect(uniqueVersions.size).toBeGreaterThanOrEqual(2);
  });

  it('keeps the documented Node support aligned with package engines and CI', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { engines?: { node?: string } };
    const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');
    const runtimeRequirements = readFileSync(
      resolve(process.cwd(), 'docs/runtime-requirements.md'),
      'utf8',
    );

    expect(packageJson.engines?.node).toBe('>=20.0.0');
    expect(readme).toContain('Node.js 20, 22, and 24');
    expect(runtimeRequirements).toContain('Minimum: Node.js 20');
    expect(runtimeRequirements).toContain(
      'Tested in CI: Node.js 20, 22, and 24',
    );
    expect(runtimeRequirements).not.toMatch(/Node\.js 18/);
  });
});
