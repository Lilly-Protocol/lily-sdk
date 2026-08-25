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

  it('accepts valid retryable status codes', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      retry: { retryableStatusCodes: [408, 429, 500, 599] },
      fetch: globalThis.fetch,
    });

    expect(config.retry.retryableStatusCodes).toEqual([408, 429, 500, 599]);
  });

  it('accepts an empty retryable status code array', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      retry: { retryableStatusCodes: [] },
      fetch: globalThis.fetch,
    });

    expect(config.retry.retryableStatusCodes).toEqual([]);
  });

  it.each(['429', [429, 'oops'], [429, 5.5], [99], [600]])(
    'throws when retryable status codes are invalid: %j',
    (retryableStatusCodes) => {
      expect(() =>
        resolveLilySdkConfig({
          baseUrl: 'https://api.lily.test',
          retry: {
            retryableStatusCodes: retryableStatusCodes as unknown as number[],
          },
          fetch: globalThis.fetch,
        }),
      ).toThrow(LilyConfigError);
    },
  );
});
