import { afterEach, describe, expect, it } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('resolveLilySdkConfig', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

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

  it('throws when baseUrl is empty or missing', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: '',
        fetch: globalThis.fetch,
      }),
    ).toThrow(LilyConfigError);
  });

  it('throws when no fetch implementation is available', () => {
    const savedFetch = globalThis.fetch;
    // @ts-expect-error intentionally removing global fetch
    delete globalThis.fetch;
    try {
      expect(() =>
        resolveLilySdkConfig({
          baseUrl: 'https://api.lily.test',
        }),
      ).toThrow(LilyConfigError);
    } finally {
      globalThis.fetch = savedFetch;
    }
  });

  it('throws when fetch is not a function', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: 'not-a-function' as unknown as typeof globalThis.fetch,
      }),
    ).toThrow('No fetch implementation');
  });

  it('throws when retry.retries is not an integer', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retries: 2.5 },
      }),
    ).toThrow(LilyConfigError);
  });

  it('throws when retry.retries is negative', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retries: -1 },
      }),
    ).toThrow('non-negative integer');
  });

  it('throws when retry.retryDelayMs is negative', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retryDelayMs: -100 },
      }),
    ).toThrow(LilyConfigError);
  });

  it('throws when retry.retryDelayMs is NaN', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retryDelayMs: NaN },
      }),
    ).toThrow('non-negative number');
  });

  it('throws when retry.retryableStatusCodes is not an array', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retryableStatusCodes: 'not-an-array' as unknown as number[] },
      }),
    ).toThrow(LilyConfigError);
  });

  it('passes valid retry configuration through', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      retry: {
        retries: 5,
        retryDelayMs: 500,
        retryableStatusCodes: [500, 502],
      },
    });

    expect(config.retry.retries).toBe(5);
    expect(config.retry.retryDelayMs).toBe(500);
    expect(config.retry.retryableStatusCodes).toEqual([500, 502]);
  });

  it('passes apiKey and authToken through when provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      apiKey: 'secret-key',
      authToken: 'token-abc',
    });

    expect(config.apiKey).toBe('secret-key');
    expect(config.authToken).toBe('token-abc');
  });

  it('freezes defaultHeaders', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      defaultHeaders: { 'X-Custom': 'value' },
    });

    expect(Object.isFrozen(config.defaultHeaders)).toBe(true);
  });

  it('appends trailing slash to baseUrl if missing', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(config.baseUrl.toString()).toBe('https://api.lily.test/');
  });

  it('uses custom userAgent when provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      userAgent: 'my-app/1.0',
    });

    expect(config.userAgent).toBe('my-app/1.0');
  });

  it('uses custom timeoutMs when provided', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      timeoutMs: 30_000,
    });

    expect(config.timeoutMs).toBe(30_000);
  });
});
