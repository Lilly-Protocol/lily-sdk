import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyConfigError } from '../src/errors/sdk-error';
import { LilySdk } from '../src/sdk';

/**
 * Issue #444: the constructor path must honor the same baseUrl environment
 * variable precedence as LilySdk.create() (LILY_API_URL ?? LILY_BASE_URL).
 */
describe('baseUrl environment fallback on the constructor path (issue #444)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.LILY_API_URL;
    delete process.env.LILY_BASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('constructs with only LILY_BASE_URL set', () => {
    process.env.LILY_BASE_URL = 'https://base-env.lily.test';

    const sdk = new LilySdk({ apiKey: 'explicit-key' });

    expect(sdk.config.baseUrl.toString()).toBe('https://base-env.lily.test/');
    expect(sdk.config.apiKey).toBe('explicit-key');
  });

  it('prefers LILY_API_URL over LILY_BASE_URL', () => {
    process.env.LILY_API_URL = 'https://api-env.lily.test';
    process.env.LILY_BASE_URL = 'https://base-env.lily.test';

    const sdk = new LilySdk();

    expect(sdk.config.baseUrl.toString()).toBe('https://api-env.lily.test/');
  });

  it('matches create() precedence when no env var is set for baseUrl', () => {
    const viaConstructor = new LilySdk({ baseUrl: 'https://explicit.lily.test' });
    const viaFactory = LilySdk.create({
      baseUrl: 'https://explicit.lily.test',
    });

    expect(viaConstructor.config.baseUrl.toString()).toBe(
      viaFactory.config.baseUrl.toString(),
    );
  });

  it('gives an explicit baseUrl precedence over both env vars', () => {
    process.env.LILY_API_URL = 'https://api-env.lily.test';
    process.env.LILY_BASE_URL = 'https://base-env.lily.test';

    const sdk = new LilySdk({ baseUrl: 'https://explicit.lily.test' });

    expect(sdk.config.baseUrl.toString()).toBe('https://explicit.lily.test/');
  });

  it('throws a config error naming both env vars when no baseUrl source exists', () => {
    expect(() => new LilySdk()).toThrow(LilyConfigError);
    expect(() => new LilySdk()).toThrow(
      /LILY_API_URL or LILY_BASE_URL environment variable/,
    );
  });

  it('resolveLilySdkConfig honors LILY_BASE_URL as a fallback', () => {
    process.env.LILY_BASE_URL = 'https://resolved.lily.test';

    const config = resolveLilySdkConfig({});

    expect(config.baseUrl.toString()).toBe('https://resolved.lily.test/');
  });
});
