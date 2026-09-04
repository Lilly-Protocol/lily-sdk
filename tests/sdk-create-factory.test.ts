import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LilySdk } from '../src/sdk';
import { LilyConfigError } from '../src/errors/sdk-error.js';

describe('LilySdk.create()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates an instance with explicit config', () => {
    const sdk = LilySdk.create({ baseUrl: 'https://api.example.com' });
    expect(sdk).toBeInstanceOf(LilySdk);
    expect(sdk.config.baseUrl.toString()).toBe('https://api.example.com/');
  });

  it('falls back to LILY_API_URL env var when no baseUrl is provided', () => {
    process.env.LILY_API_URL = 'https://env.example.com';
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://env.example.com/');
  });

  it('falls back to LILY_BASE_URL when LILY_API_URL is unset', () => {
    delete process.env.LILY_API_URL;
    process.env.LILY_BASE_URL = 'https://legacy.example.com';
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://legacy.example.com/');
  });

  it('prefers LILY_API_URL over LILY_BASE_URL when both are set', () => {
    process.env.LILY_API_URL = 'https://primary.example.com';
    process.env.LILY_BASE_URL = 'https://legacy.example.com';
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://primary.example.com/');
  });

  it('never throws solely for a missing baseUrl (DEFAULT_API_URL fallback)', () => {
    delete process.env.LILY_API_URL;
    delete process.env.LILY_BASE_URL;

    expect(() => LilySdk.create()).not.toThrow();

    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://api.lilyprotocol.com/');
  });

  it('explicit config overrides LILY_API_URL env var', () => {
    process.env.LILY_API_URL = 'https://env.example.com';
    const sdk = LilySdk.create({ baseUrl: 'https://explicit.example.com' });
    expect(sdk.config.baseUrl.toString()).toBe('https://explicit.example.com/');
  });

  it('reads apiKey from LILY_API_KEY env var', () => {
    process.env.LILY_API_URL = 'https://api.example.com';
    process.env.LILY_API_KEY = 'env-key';
    const sdk = LilySdk.create();
    expect(sdk.config.apiKey).toBe('env-key');
  });

  it('is the constructor route that throws for a missing baseUrl, not create()', () => {
    delete process.env.LILY_API_URL;
    delete process.env.LILY_BASE_URL;

    expect(() => LilySdk.create()).not.toThrow();
    expect(() => new LilySdk()).toThrow(LilyConfigError);
  });
});
