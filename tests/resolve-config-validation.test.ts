import { describe, expect, it, vi } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('resolveLilySdkConfig — validation branches', () => {
  it('throws when baseUrl is missing', () => {
    expect(() => resolveLilySdkConfig({} as LilySdkConfig)).toThrow(LilyConfigError);
    expect(() => resolveLilySdkConfig({} as LilySdkConfig)).toThrow('`baseUrl` is required');
  });

  it('throws when baseUrl is not a valid URL', () => {
    expect(() => resolveLilySdkConfig({ baseUrl: 'not-a-url' })).toThrow(LilyConfigError);
    expect(() => resolveLilySdkConfig({ baseUrl: 'not-a-url' })).toThrow('valid absolute URL');
  });

  it('throws when baseUrl is a relative URL', () => {
    expect(() => resolveLilySdkConfig({ baseUrl: '/api' })).toThrow(LilyConfigError);
  });

  it('throws when timeoutMs is not a positive number', () => {
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', timeoutMs: 0 }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', timeoutMs: -1 }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', timeoutMs: NaN }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', timeoutMs: Infinity }),
    ).toThrow(LilyConfigError);
  });

  it('throws when retry.retries is not a non-negative integer', () => {
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', retry: { retries: -1 } }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', retry: { retries: 1.5 } }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', retry: { retries: 'two' as any } }),
    ).toThrow(LilyConfigError);
  });

  it('throws when retry.retryDelayMs is negative', () => {
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', retry: { retryDelayMs: -1 } }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test', retry: { retryDelayMs: NaN } }),
    ).toThrow(LilyConfigError);
  });

  it('throws when fetch is not available and not provided', () => {
    const originalFetch = globalThis.fetch;
    // @ts-ignore
    globalThis.fetch = undefined;

    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test' }),
    ).toThrow(LilyConfigError);
    expect(() =>
      resolveLilySdkConfig({ baseUrl: 'https://api.lily.test' }),
    ).toThrow('fetch implementation');

    globalThis.fetch = originalFetch;
  });

  it('accepts a custom fetch implementation', () => {
    const customFetch = vi.fn();
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: customFetch,
    });

    expect(config.fetch).toBe(customFetch);
  });

  it('applies default values when optional fields are missing', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
    });

    expect(config.timeoutMs).toBe(10_000);
    expect(config.userAgent).toBe('lily-sdk/0.1.0');
    expect(config.retry.retries).toBe(2);
    expect(config.retry.retryDelayMs).toBe(250);
    expect(config.retry.retryableStatusCodes).toEqual([408, 409, 425, 429, 500, 502, 503, 504]);
  });

  it('normalizes baseUrl by ensuring trailing slash', () => {
    const config1 = resolveLilySdkConfig({ baseUrl: 'https://api.lily.test' });
    const config2 = resolveLilySdkConfig({ baseUrl: 'https://api.lily.test/' });

    expect(config1.baseUrl.href).toBe(config2.baseUrl.href);
    expect(config1.baseUrl.href).toBe('https://api.lily.test/');
  });

  it('freezes defaultHeaders', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      defaultHeaders: { 'X-Test': 'value' },
    });

    expect(Object.isFrozen(config.defaultHeaders)).toBe(true);
  });

  it('omits apiKey from resolved config when not provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
    }) as any;

    expect(config.apiKey).toBeUndefined();
  });

  it('omits authToken from resolved config when not provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
    }) as any;

    expect(config.authToken).toBeUndefined();
  });

  it('includes apiKey when provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      apiKey: 'test-key',
    }) as any;

    expect(config.apiKey).toBe('test-key');
  });

  it('includes authToken when provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      authToken: 'test-token',
    }) as any;

    expect(config.authToken).toBe('test-token');
  });
});
