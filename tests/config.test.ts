import { describe, expect, it } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import packageJson from '../package.json';

describe('resolveLilySdkConfig', () => {
  it('normalizes base url and defaults', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(config.timeoutMs).toBe(10_000);
    expect(config.retry.retries).toBe(2);
    expect(config.userAgent).toBe(`lily-sdk/${packageJson.version}`);
  });

  it('uses an explicitly configured user agent', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      userAgent: 'my-app/1.2.3',
      fetch: globalThis.fetch,
    });

    expect(config.userAgent).toBe('my-app/1.2.3');
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
