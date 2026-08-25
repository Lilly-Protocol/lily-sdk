import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { LilySdk } from '../src/sdk';

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

describe('LilySdk.create() factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reads LILY_API_URL from env when no baseUrl is provided', () => {
    process.env.LILY_API_URL = 'https://env.lily.test';
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://env.lily.test/');
  });

  it('uses default URL when neither option nor env is set', () => {
    delete process.env.LILY_API_URL;
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://api.lilyprotocol.com/');
  });

  it('explicit option wins over env var', () => {
    process.env.LILY_API_URL = 'https://env.lily.test';
    const sdk = LilySdk.create({ baseUrl: 'https://explicit.lily.test' });
    expect(sdk.config.baseUrl.toString()).toBe('https://explicit.lily.test/');
  });

  it('reads LILY_API_KEY from env', () => {
    process.env.LILY_API_KEY = 'env-key';
    const sdk = LilySdk.create();
    expect(sdk.config.apiKey).toBe('env-key');
  });

  it('explicit apiKey wins over env var', () => {
    process.env.LILY_API_KEY = 'env-key';
    const sdk = LilySdk.create({ apiKey: 'explicit-key' });
    expect(sdk.config.apiKey).toBe('explicit-key');
  });

  it('reads LILY_AUTH_TOKEN from env', () => {
    process.env.LILY_AUTH_TOKEN = 'env-token';
    const sdk = LilySdk.create();
    expect(sdk.config.authToken).toBe('env-token');
  });
});
