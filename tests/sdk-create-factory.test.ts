import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LilySdk, DEFAULT_API_URL } from '../src/sdk';

describe('LilySdk.create()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.LILY_API_URL;
    delete process.env.LILY_BASE_URL;
    delete process.env.LILY_API_KEY;
    delete process.env.LILY_AUTH_TOKEN;
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

  it('falls back to LILY_BASE_URL when LILY_API_URL is not set', () => {
    process.env.LILY_BASE_URL = 'https://legacy.example.com';
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe('https://legacy.example.com/');
  });

  it('falls back to DEFAULT_API_URL when no options or env vars are set (never throws)', () => {
    // The legacy code threw `new Error('baseUrl is required. ...')` here, but
    // DEFAULT_API_URL makes that branch unreachable. The factory must succeed
    // silently so callers can boot without setting any env vars.
    expect(() => LilySdk.create()).not.toThrow();
    const sdk = LilySdk.create();
    expect(sdk.config.baseUrl.toString()).toBe(
      new URL(DEFAULT_API_URL).toString(),
    );
  });

  it('falls back to DEFAULT_API_URL when called with an empty options object', () => {
    expect(() => LilySdk.create({})).not.toThrow();
    const sdk = LilySdk.create({});
    expect(sdk.config.baseUrl.toString()).toBe(
      new URL(DEFAULT_API_URL).toString(),
    );
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
});
