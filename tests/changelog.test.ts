import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #52 — $25
 * "Add a CHANGELOG.md and link it from the README"
 *
 * Verifies that CHANGELOG.md exists and is referenced in the README.
 */
describe('CHANGELOG.md', () => {
  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  const readmePath = resolve(process.cwd(), 'README.md');

  it('CHANGELOG.md exists', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('CHANGELOG.md has a main heading', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content).toMatch(/^# /m);
  });

  it('CHANGELOG.md has at least one version section', () => {
    const content = readFileSync(changelogPath, 'utf8');
    expect(content).toMatch(/^## /m);
  });

  it('README.md links to CHANGELOG.md', () => {
    const readme = readFileSync(readmePath, 'utf8');
    expect(readme.toLowerCase()).toContain('changelog');
  });
});
