import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('retryableStatusCodes validation', () => {
  it('accepts an array of valid HTTP status codes', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [429, 503] },
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retryableStatusCodes).toEqual([429, 503]);
  });

  it('accepts a single-element array', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [503] },
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retryableStatusCodes).toEqual([503]);
  });

  it('accepts an empty array (disables status-based retries)', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [] },
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retryableStatusCodes).toEqual([]);
  });

  it('uses defaults when not provided', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev' };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.retry.retryableStatusCodes).toContain(429);
    expect(resolved.retry.retryableStatusCodes).toContain(503);
  });

  it('rejects non-array retryableStatusCodes', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: '429' as any },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects non-integer entries', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [429.5] as any },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects entries below 100', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [99] },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects entries above 599', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [600] },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects string entries', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: ['429'] as any },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects NaN entries', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [NaN] as any },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects Infinity entries', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      retry: { retryableStatusCodes: [Infinity] as any },
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });
});
