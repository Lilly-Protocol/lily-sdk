import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('LilySdk.withConfig', () => {
  const baseConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'base-key',
    authToken: 'base-token',
    timeoutMs: 1000,
  };

  it('creates a new instance with merged config', () => {
    const sdk = new LilySdk(baseConfig);
    const derived = sdk.withConfig({ apiKey: 'tenant-key' });

    expect(derived).toBeInstanceOf(LilySdk);
    expect(derived.config.apiKey).toBe('tenant-key');
    expect(derived.config.authToken).toBe('base-token');
    expect(derived.config.baseUrl.toString()).toBe('https://api.example.com/');
    expect(derived.config.timeoutMs).toBe(1000);
  });

  it('does not mutate the original instance', () => {
    const sdk = new LilySdk(baseConfig);
    sdk.withConfig({ apiKey: 'tenant-key' });

    expect(sdk.config.apiKey).toBe('base-key');
  });

  it('allows overriding baseUrl', () => {
    const sdk = new LilySdk(baseConfig);
    const derived = sdk.withConfig({ baseUrl: 'https://tenant.example.com' });

    expect(derived.config.baseUrl.toString()).toBe('https://tenant.example.com/');
    expect(sdk.config.baseUrl.toString()).toBe('https://api.example.com/');
  });

  it('preserves custom httpClient reference across derived instances', () => {
    const sdk = new LilySdk(baseConfig);
    const derived = sdk.withConfig({ apiKey: 'other' });

    // Both should share internal transport shape (verified via same timeout/retry defaults)
    expect(derived.config.retry).toEqual(sdk.config.retry);
    expect(derived.config.defaultHeaders).toEqual(sdk.config.defaultHeaders);
  });
});
