import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('URL instance acceptance for baseUrl', () => {
  it('accepts a URL object for baseUrl', () => {
    const config = {
      baseUrl: new URL('https://api.lily.dev'),
      apiKey: 'k',
    } as unknown as LilySdkConfig;
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/');
  });

  it('accepts a URL object with path prefix', () => {
    const config = {
      baseUrl: new URL('https://api.lily.dev/v1'),
      apiKey: 'k',
    } as unknown as LilySdkConfig;
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/v1/');
  });

  it('accepts a URL object with trailing slash', () => {
    const config = {
      baseUrl: new URL('https://api.lily.dev/'),
      apiKey: 'k',
    } as unknown as LilySdkConfig;
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.baseUrl.href).toBe('https://api.lily.dev/');
  });

  it('rejects a URL object with non-HTTP scheme', () => {
    const config = {
      baseUrl: new URL('ftp://example.com'),
      apiKey: 'k',
    } as unknown as LilySdkConfig;
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects a URL object with file scheme', () => {
    const config = {
      baseUrl: new URL('file:///etc/passwd'),
      apiKey: 'k',
    } as unknown as LilySdkConfig;
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });
});
