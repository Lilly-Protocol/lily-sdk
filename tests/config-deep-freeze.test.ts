import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('config deep-freeze', () => {
  it('freezes the resolved config object', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(Object.isFrozen(resolved)).toBe(true);
  });

  it('freezes the retry policy', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(Object.isFrozen(resolved.retry)).toBe(true);
  });

  it('freezes the defaultHeaders', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(Object.isFrozen(resolved.defaultHeaders)).toBe(true);
  });

  it('freezes retryableStatusCodes array', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(Object.isFrozen(resolved.retry.retryableStatusCodes)).toBe(true);
  });

  it('throws in strict mode when mutating config', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(() => {
      'use strict';
      (resolved as any).timeoutMs = 999;
    }).toThrow();
  });

  it('throws when mutating retry policy', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(() => {
      'use strict';
      (resolved.retry as any).retries = 99;
    }).toThrow();
  });

  it('throws when mutating defaultHeaders', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(() => {
      'use strict';
      (resolved.defaultHeaders as any).x = 'y';
    }).toThrow();
  });

  it('throws when mutating retryableStatusCodes', () => {
    const config: LilySdkConfig = { baseUrl: 'https://api.lily.dev', apiKey: 'k' };
    const resolved = resolveLilySdkConfig(config);
    expect(() => {
      'use strict';
      (resolved.retry.retryableStatusCodes as any).push(999);
    }).toThrow();
  });
});
