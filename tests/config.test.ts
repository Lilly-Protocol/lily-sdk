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

  it.each(['http://api.lily.test', 'https://api.lily.test'])(
    'accepts an HTTP base url: %s',
    (baseUrl) => {
      const config = resolveLilySdkConfig({
        baseUrl,
        fetch: globalThis.fetch,
      });

      expect(config.baseUrl.toString()).toBe(`${baseUrl}/`);
    },
  );

  it.each(['ftp:', 'file:', 'ws:'])('rejects the %s scheme', (scheme) => {
    const resolve = () =>
      resolveLilySdkConfig({
        baseUrl: `${scheme}//example.test`,
        fetch: globalThis.fetch,
      });

    expect(resolve).toThrow(LilyConfigError);
    expect(resolve).toThrow(scheme);
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
