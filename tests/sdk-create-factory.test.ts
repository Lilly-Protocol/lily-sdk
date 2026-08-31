import { describe, it, expect, afterEach } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('LilySdk.create()', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates an instance using environment variables when no options are provided', () => {
    process.env.LILY_API_URL = 'https://env.example.com';
    process.env.LILY_API_KEY = 'env-key';
    process.env.LILY_AUTH_TOKEN = 'env-token';

    const sdk = LilySdk.create();

    expect(sdk.config.baseUrl.toString()).toBe('https://env.example.com/');
    expect(sdk.config.apiKey).toBe('env-key');
    expect(sdk.config.authToken).toBe('env-token');
  });

  it('allows explicit options to override environment variables', () => {
    process.env.LILY_API_URL = 'https://env.example.com';
    process.env.LILY_API_KEY = 'env-key';

    const sdk = LilySdk.create({
      baseUrl: 'https://override.example.com',
      apiKey: 'override-key',
    });

    expect(sdk.config.baseUrl.toString()).toBe('https://override.example.com/');
    expect(sdk.config.apiKey).toBe('override-key');
  });

  it('throws when neither options nor LILY_API_URL are set', () => {
    delete process.env.LILY_API_URL;
    delete process.env.LILY_API_KEY;
    delete process.env.LILY_AUTH_TOKEN;

    expect(() => LilySdk.create()).toThrow(/baseUrl is required/);
  });
});
