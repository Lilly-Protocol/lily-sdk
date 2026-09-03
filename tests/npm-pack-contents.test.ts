import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #113 — $75
 * "Add an npm pack contents check to CI"
 *
 * Verifies that the `files` field in package.json only includes
 * necessary files and excludes source, tests, and config.
 */
describe('npm pack contents', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as { files: string[]; main: string; module: string; types: string };

  it('files field is an array', () => {
    expect(Array.isArray(pkg.files)).toBe(true);
  });

  it('files includes dist', () => {
    expect(pkg.files).toContain('dist');
  });

  it('files includes README.md', () => {
    expect(pkg.files).toContain('README.md');
  });

  it('files includes LICENSE', () => {
    expect(pkg.files).toContain('LICENSE');
  });

  it('files does NOT include src', () => {
    expect(pkg.files).not.toContain('src');
  });

  it('files does NOT include tests', () => {
    expect(pkg.files).not.toContain('tests');
    expect(pkg.files).not.toContain('test');
  });

  it('files does NOT include node_modules', () => {
    expect(pkg.files).not.toContain('node_modules');
  });

  it('files does NOT include coverage', () => {
    expect(pkg.files).not.toContain('coverage');
  });

  it('main entry points to dist', () => {
    expect(pkg.main).toContain('dist');
  });

  it('module entry points to dist', () => {
    expect(pkg.module).toContain('dist');
  });

  it('types entry points to dist .d.ts', () => {
    expect(pkg.types).toContain('dist');
    expect(pkg.types).toMatch(/\.d\.ts$/);
  });

  it('files count is reasonable (<= 5)', () => {
    expect(pkg.files.length).toBeLessThanOrEqual(5);
  });
});
