import { describe, expect, it } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilySdk } from '../src/sdk';

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

  it('deep-freezes the resolved retry policy', () => {
    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.test',
      defaultHeaders: { 'x-client': 'test' },
      retry: { retryableStatusCodes: [429, 503] },
      fetch: globalThis.fetch,
    });

    expect(Object.isFrozen(sdk.config.retry)).toBe(true);
    expect(Object.isFrozen(sdk.config.retry.retryableStatusCodes)).toBe(true);
    expect(Object.isFrozen(sdk.config.defaultHeaders)).toBe(true);

    expect(Reflect.set(sdk.config.retry, 'retries', 99)).toBe(false);
    expect(Reflect.set(sdk.config.retry.retryableStatusCodes, 0, 200)).toBe(
      false,
    );
    expect(sdk.config.retry.retries).toBe(2);
    expect(sdk.config.retry.retryableStatusCodes).toEqual([429, 503]);
  });
});
