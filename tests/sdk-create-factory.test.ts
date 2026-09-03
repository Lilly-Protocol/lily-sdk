import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LilySdk } from '../src/sdk';

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
