import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #119 — $65
 * "Add repository, homepage, and bugs metadata to package.json"
 *
 * Verifies that package.json contains repository, homepage, and bugs URLs.
 */
describe('package.json metadata', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as Record<string, unknown>;

  it('has a repository field', () => {
    expect(pkg).toHaveProperty('repository');
    const repo = pkg.repository as { type?: string; url?: string };
    expect(repo.type).toBe('git');
    expect(repo.url).toContain('github.com');
  });

  it('has a homepage field', () => {
    expect(pkg).toHaveProperty('homepage');
    expect(pkg.homepage).toContain('github.com');
  });

  it('has a bugs field with a url', () => {
    expect(pkg).toHaveProperty('bugs');
    const bugs = pkg.bugs as { url?: string };
    expect(bugs.url).toContain('github.com');
    expect(bugs.url).toContain('/issues');
  });

  it('has a license field', () => {
    expect(pkg.license).toBe('MIT');
  });

  it('has an author field', () => {
    expect(pkg).toHaveProperty('author');
  });

  it('has a description field', () => {
    expect(pkg).toHaveProperty('description');
    expect(typeof pkg.description).toBe('string');
    expect((pkg.description as string).length).toBeGreaterThan(10);
  });

  it('has keywords array with at least 3 entries', () => {
    expect(Array.isArray(pkg.keywords)).toBe(true);
    expect((pkg.keywords as string[]).length).toBeGreaterThanOrEqual(3);
  });
});
