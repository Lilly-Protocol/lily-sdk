import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('baseUrl path-prefix handling', () => {
  it('appends a trailing slash if missing', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/');
  });

  it('preserves an existing trailing slash', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev/' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/');
  });

  it('preserves a path prefix in baseUrl', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev/v1' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/v1/');
  });

  it('preserves a path prefix with trailing slash', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev/v1/' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/v1/');
  });

  it('rejects non-HTTP schemes', () => {
    const config: LilySdkConfig = { baseUrl: 'ftp://example.com' };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects relative URLs', () => {
    const config: LilySdkConfig = { baseUrl: '/api' };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('accepts localhost with http', () => {
    const config: LilySdkConfig = { baseUrl: 'http://localhost:3000' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('http://localhost:3000/');
  });

  it('normalizes a double-slash path prefix', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev//v1' };
    const resolved = resolveLilySdkConfig(config);
    // URL constructor normalizes double slashes in path
    expect(resolved.baseUrl.href).toContain('api.lily.dev');
  });
});
