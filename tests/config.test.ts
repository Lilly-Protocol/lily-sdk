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

  it('deep-freezes the resolved config snapshot', () => {
    const input = {
      baseUrl: 'https://api.lily.test',
      timeoutMs: 5_000,
      retry: {
        retries: 3,
        retryableStatusCodes: [429, 503],
      },
      defaultHeaders: {
        'x-client': 'test',
      },
      fetch: globalThis.fetch,
    };
    const config = resolveLilySdkConfig(input);

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.baseUrl)).toBe(true);
    expect(Object.isFrozen(config.defaultHeaders)).toBe(true);
    expect(Object.isFrozen(config.retry)).toBe(true);
    expect(Object.isFrozen(config.retry.retryableStatusCodes)).toBe(true);

    expect(() => {
      (config as { timeoutMs: number }).timeoutMs = 1;
    }).toThrow(TypeError);
    expect(() => {
      (config.defaultHeaders as Record<string, string>)['x-client'] = 'changed';
    }).toThrow(TypeError);
    expect(() => {
      config.retry.retryableStatusCodes.push(500);
    }).toThrow(TypeError);
    expect(() => {
      (config.baseUrl as URL & { changed?: boolean }).changed = true;
    }).toThrow(TypeError);

    input.retry.retryableStatusCodes.push(500);
    input.defaultHeaders['x-client'] = 'changed';

    expect(config.timeoutMs).toBe(5_000);
    expect(config.defaultHeaders).toEqual({ 'x-client': 'test' });
    expect(config.retry.retryableStatusCodes).toEqual([429, 503]);
    expect('changed' in config.baseUrl).toBe(false);
  });
});
