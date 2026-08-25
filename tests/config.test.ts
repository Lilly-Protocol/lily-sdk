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

it('accepts URL instance for baseUrl', () => {
  const config = resolveLilySdkConfig({
    baseUrl: new URL('https://api.lily.test'),
    fetch: globalThis.fetch,
  });

  expect(config.baseUrl.toString()).toBe('https://api.lily.test/');
});

it('normalizes URL instance with trailing slash', () => {
  const config = resolveLilySdkConfig({
    baseUrl: new URL('https://api.lily.test/'),
    fetch: globalThis.fetch,
  });

  expect(config.baseUrl.toString()).toBe('https://api.lily.test/');
});
