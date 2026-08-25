import { describe, expect, it } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('resolveLilySdkConfig', () => {
  it('normalizes base url and defaults', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(config.timeoutMs).toBe(10_000);
    expect(config.retry.retries).toBe(2);
    expect(config.userAgent).toBe('lily-sdk/0.1.0');
  });

  it('throws when base url is invalid', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'not-a-url',
        fetch: globalThis.fetch,
      }),
    ).toThrow(LilyConfigError);
  });

  it('throws when timeout is invalid', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        timeoutMs: 0,
        fetch: globalThis.fetch,
      }),
    ).toThrow('`timeoutMs` must be a positive number.');
  });
});

it('throws LilyConfigError on unknown config keys with suggestion', () => {
  expect(() =>
    resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      timeout: 5000,
    } as any),
  ).toThrow(LilyConfigError);

  try {
    resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      timeout: 5000,
    } as any);
  } catch (error) {
    expect((error as Error).message).toContain('timeout');
    expect((error as Error).message).toContain('timeoutMs');
  }
});

it('throws listing multiple unknown keys', () => {
  expect(() =>
    resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      apikey: 'secret',
      baseurl: 'https://other.test',
    } as any),
  ).toThrow(/Unknown LilySdkConfig key/);
});

it('accepts all known keys without error', () => {
  const config = resolveLilySdkConfig({
    baseUrl: 'https://api.lily.test',
    apiKey: 'key',
    authToken: 'token',
    timeoutMs: 5000,
    retry: { retries: 1, retryDelayMs: 100 },
    defaultHeaders: { 'x-custom': 'val' },
    userAgent: 'test-agent',
    fetch: globalThis.fetch,
  });

  expect(config.timeoutMs).toBe(5000);
  expect(config.apiKey).toBe('key');
  expect(config.userAgent).toBe('test-agent');
});
