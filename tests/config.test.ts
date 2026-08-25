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

  it.each([
    ['apiKey', { apiKey: '' }, '`apiKey` must be a non-empty string.'],
    ['authToken', { authToken: '' }, '`authToken` must be a non-empty string.'],
  ])('throws when %s is empty', (_field, credential, message) => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        ...credential,
      }),
    ).toThrowError(LilyConfigError);

    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        ...credential,
      }),
    ).toThrow(message);
  });

  it.each([
    ['apiKey', 123],
    ['authToken', null],
  ])('throws when %s is not a string', (field, value) => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        [field]: value,
      } as Parameters<typeof resolveLilySdkConfig>[0]),
    ).toThrow(`\`${field}\` must be a non-empty string.`);
  });

  it('preserves legitimate credentials and permits absent credentials', () => {
    const authenticated = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      apiKey: 'key',
      authToken: 'token',
      fetch: globalThis.fetch,
    });
    const unauthenticated = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(authenticated.apiKey).toBe('key');
    expect(authenticated.authToken).toBe('token');
    expect(unauthenticated).not.toHaveProperty('apiKey');
    expect(unauthenticated).not.toHaveProperty('authToken');
  });
});
