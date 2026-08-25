import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('per-request timeout opt-out (timeoutMs: 0)', () => {
  it('throws when global timeoutMs is 0', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      timeoutMs: 0,
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('throws when global timeoutMs is negative', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      timeoutMs: -1,
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('throws when global timeoutMs is NaN', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      timeoutMs: NaN,
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('throws when global timeoutMs is Infinity', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      timeoutMs: Infinity,
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('accepts a positive timeoutMs', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      timeoutMs: 5000,
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.timeoutMs).toBe(5000);
  });

  it('defaults timeoutMs to 10000', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.timeoutMs).toBe(10_000);
  });
});
