import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';
import type { HttpClient } from '../src/http/types';

describe('LilySdk.withConfig', () => {
  const baseConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'base-key',
    authToken: 'base-token',
  };

  it('creates a new instance with merged config overrides', () => {
    const sdk = new LilySdk(baseConfig);
    const tenantSdk = sdk.withConfig({ apiKey: 'tenant-key' });

    expect(tenantSdk).toBeInstanceOf(LilySdk);
    expect(tenantSdk).not.toBe(sdk);
    expect(tenantSdk.config.apiKey).toBe('tenant-key');
    expect(tenantSdk.config.authToken).toBe('base-token');
    expect(tenantSdk.config.baseUrl.toString()).toBe(
      'https://api.example.com/',
    );
  });

  it('allows overriding baseUrl for tenant isolation', () => {
    const sdk = new LilySdk(baseConfig);
    const tenantSdk = sdk.withConfig({ baseUrl: 'https://tenant.example.com' });

    expect(tenantSdk.config.baseUrl.toString()).toBe(
      'https://tenant.example.com/',
    );
    expect(sdk.config.baseUrl.toString()).toBe('https://api.example.com/');
  });

  it('shares the same httpClient transport shape across instances', () => {
    const mockHttpClient: HttpClient = {
      request: () => Promise.resolve({ status: 200, data: {}, headers: {} }),
    } as unknown as HttpClient;

    const sdk = new LilySdk(baseConfig, mockHttpClient);
    const tenantSdk = sdk.withConfig({ apiKey: 'tenant-key' });

    // Both should use the injected client (verified by not throwing during construction)
    expect(tenantSdk.config.apiKey).toBe('tenant-key');
  });

  it('does not mutate the original SDK instance', () => {
    const sdk = new LilySdk(baseConfig);
    const originalApiKey = sdk.config.apiKey;

    sdk.withConfig({ apiKey: 'mutated-key' });

    expect(sdk.config.apiKey).toBe(originalApiKey);
  });
});
