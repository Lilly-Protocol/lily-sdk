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

  it('aligns README, runtime docs, engines, and CI matrix on Node >= 20', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { engines?: { node?: string } };
    const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');
    const runtimeDocs = readFileSync(
      resolve(process.cwd(), 'docs/runtime-requirements.md'),
      'utf8',
    );
    const ciYml = readFileSync(
      resolve(process.cwd(), '.github/workflows/ci.yml'),
      'utf8',
    );

    // Baseline: package engines require Node 20+.
    expect(pkg.engines?.node).toMatch(/^>=20(\.0\.0)?$/);

    // Parse the CI node-version matrix from the workflow (e.g. [20, 22, 24]).
    const matrixMatch = ciYml.match(/node-version:\s*\[([^\]]+)\]/);
    expect(matrixMatch).not.toBeNull();
    const matrixVersions = matrixMatch![1]
      .split(',')
      .map((v) => v.trim().replace(/['"]/g, ''))
      .filter(Boolean);
    expect(matrixVersions).toEqual(['20', '22', '24']);

    // README CI wording must list the same versions as the workflow matrix.
    expect(readme).toMatch(/Node\.js 20,\s*22,\s*and 24/);
    expect(readme).not.toMatch(/Automated tests run against Node\.js 20 and Node\.js 22\./);

    // Runtime docs must match engines (>=20) and the CI matrix; no Node 18 support claims.
    expect(runtimeDocs).toMatch(/Minimum:\s*Node\.js 20/);
    expect(runtimeDocs).toMatch(/Tested in CI:\s*Node\.js 20,\s*22,\s*and 24/);
    expect(runtimeDocs).toMatch(/>=20\.0\.0/);
    expect(runtimeDocs).not.toMatch(/Minimum:\s*Node\.js 18/);
    expect(runtimeDocs).not.toMatch(/Tested:\s*Node\.js 18/);
    expect(runtimeDocs).toMatch(/Node\.js 18 is not supported/);
  });
});
