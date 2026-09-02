import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { SDK_VERSION } from '../src/version';

describe('resolveLilySdkConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses explicit baseUrl over env', () => {
    process.env.LILY_API_URL = 'https://env.example.com';
    const config = resolveLilySdkConfig({ baseUrl: 'https://explicit.example.com' });
    expect(config.baseUrl.toString()).toBe('https://explicit.example.com/');
  });

  it('falls back to LILY_API_URL when baseUrl is omitted', () => {
    process.env.LILY_API_URL = 'https://env.example.com';
    const config = resolveLilySdkConfig({});
    expect(config.baseUrl.toString()).toBe('https://env.example.com/');
  });

  it('throws when neither baseUrl nor env is provided', () => {
    delete process.env.LILY_API_URL;
    expect(() => resolveLilySdkConfig({})).toThrow(LilyConfigError);
  });

  it('resolves apiKey and authToken from env when not explicit', () => {
    process.env.LILY_API_URL = 'https://api.example.com';
    process.env.LILY_API_KEY = 'env-key';
    process.env.LILY_AUTH_TOKEN = 'env-token';
    const config = resolveLilySdkConfig({});
    expect(config.apiKey).toBe('env-key');
    expect(config.authToken).toBe('env-token');
  });

  it('prefers explicit credentials over env', () => {
    process.env.LILY_API_URL = 'https://api.example.com';
    process.env.LILY_API_KEY = 'env-key';
    process.env.LILY_AUTH_TOKEN = 'env-token';
    const config = resolveLilySdkConfig({
      apiKey: 'explicit-key',
      authToken: 'explicit-token',
    });

    expect(config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(config.timeoutMs).toBe(10_000);
    expect(config.retry.retries).toBe(2);
    expect(config.userAgent).toBe(`lily-sdk/${SDK_VERSION}`);
  });

  it('derives default user-agent from package version', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(config.userAgent).toBe(`lily-sdk/${SDK_VERSION}`);
    expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('allows explicit userAgent to override default', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
      userAgent: 'custom-agent/1.0',
    });

    expect(config.userAgent).toBe('custom-agent/1.0');
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

  it('throws when fetch implementation is missing', () => {
    const originalFetch = globalThis.fetch;
    // @ts-expect-error - intentionally removing fetch to test validation
    delete globalThis.fetch;

    try {
      expect(() =>
        resolveLilySdkConfig({
          baseUrl: 'https://api.lily.test',
        }),
      ).toThrow(LilyConfigError);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws when retry.retries is not an integer', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retries: 1.5 },
      }),
    ).toThrow('`retry.retries` must be a non-negative integer.');
  });

  it('throws when retry.retryDelayMs is negative', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retryDelayMs: -1 },
      }),
    ).toThrow('`retry.retryDelayMs` must be a non-negative number.');
  });
});


  it('throws when retry.retries is not an integer', () => {
    expect(() =>
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
        retry: { retries: 1.5 },
      }),
    ).toThrow(LilyConfigError);
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
