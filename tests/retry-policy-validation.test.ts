import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('Retry-After header handling', () => {
  it('resolves config with default retry policy', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retries).toBe(2);
    expect(resolved.retry.retryDelayMs).toBe(250);
  });

  it('accepts custom retry configuration', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retries: 5, retryDelayMs: 1000 },
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retries).toBe(5);
    expect(resolved.retry.retryDelayMs).toBe(1000);
  });

  it('rejects negative retries', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retries: -1 },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects non-integer retries', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retries: 2.5 as any },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects negative retryDelayMs', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryDelayMs: -100 },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects NaN retryDelayMs', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryDelayMs: NaN },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('accepts zero retryDelayMs', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryDelayMs: 0 },
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retryDelayMs).toBe(0);
  });

  it('accepts zero retries (disables retries)', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retries: 0 },
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retries).toBe(0);
  });
});
