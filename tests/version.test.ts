import { describe, it, expect } from 'vitest';
import { SDK_VERSION } from '../src/version';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('SDK_VERSION', () => {
  it('matches the version in package.json', () => {
    const pkgPath = resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(SDK_VERSION).toBe(pkg.version);
  });

  it('is a non-empty string', () => {
    expect(typeof SDK_VERSION).toBe('string');
    expect(SDK_VERSION.length).toBeGreaterThan(0);
  });
});
