import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

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
    expect(config.apiKey).toBe('explicit-key');
    expect(config.authToken).toBe('explicit-token');
  });
});
