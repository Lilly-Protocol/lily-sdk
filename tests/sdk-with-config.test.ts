import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('LilySdk.withConfig', () => {
  it('creates a new instance with overridden baseUrl', () => {
    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'key-1',
    });
    const derived = original.withConfig({ baseUrl: 'https://api.other.com' });

    expect(derived).toBeInstanceOf(LilySdk);
    expect(derived).not.toBe(original);
    // resolveLilySdkConfig normalizes baseUrl to a URL object with trailing slash
    expect(String(derived.config.baseUrl)).toBe('https://api.other.com/');
    expect(derived.config.apiKey).toBe('key-1');
  });

  it('preserves original config when no overrides are provided', () => {
    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'key-1',
    });
    const derived = original.withConfig({});

    expect(String(derived.config.baseUrl)).toBe('https://api.example.com/');
    expect(derived.config.apiKey).toBe('key-1');
  });

  it('overrides credentials independently per tenant', () => {
    const base = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'shared-key',
    });
    const tenantA = base.withConfig({ apiKey: 'tenant-a-key' });
    const tenantB = base.withConfig({ apiKey: 'tenant-b-key' });

    expect(tenantA.config.apiKey).toBe('tenant-a-key');
    expect(tenantB.config.apiKey).toBe('tenant-b-key');
    expect(base.config.apiKey).toBe('shared-key');
  });

  it('clears inherited apiKey when apiKey is explicitly null', () => {
    const base = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'parent-key',
      authToken: 'parent-token',
    });
    const publicChild = base.withConfig({ apiKey: null });

    expect(publicChild.config.apiKey).toBeUndefined();
    expect(publicChild.config.authToken).toBe('parent-token');

    const headers = publicChild.config.toHeaders?.() ?? {};
    expect(headers['x-api-key']).toBeUndefined();
    expect(headers['authorization']).toBe('Bearer parent-token');
  });

  it('clears inherited authToken when authToken is explicitly null', () => {
    const base = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'parent-key',
      authToken: 'parent-token',
    });
    const keyOnlyChild = base.withConfig({ authToken: null });

    expect(keyOnlyChild.config.apiKey).toBe('parent-key');
    expect(keyOnlyChild.config.authToken).toBeUndefined();

    const headers = keyOnlyChild.config.toHeaders?.() ?? {};
    expect(headers['x-api-key']).toBe('parent-key');
    expect(headers['authorization']).toBeUndefined();
  });

  it('clears both credentials when null is provided for both', () => {
    const base = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'parent-key',
      authToken: 'parent-token',
    });
    const anonymousChild = base.withConfig({ apiKey: null, authToken: null });

    expect(anonymousChild.config.apiKey).toBeUndefined();
    expect(anonymousChild.config.authToken).toBeUndefined();

    const headers = anonymousChild.config.toHeaders?.() ?? {};
    expect(headers['x-api-key']).toBeUndefined();
    expect(headers['authorization']).toBeUndefined();
  });

  it('does not fall back to env vars when credential is explicitly null', () => {
    const originalApiKey = process.env.LILY_API_KEY;
    const originalAuthToken = process.env.LILY_AUTH_TOKEN;

    try {
      process.env.LILY_API_KEY = 'env-secret-key';
      process.env.LILY_AUTH_TOKEN = 'env-secret-token';

      const base = new LilySdk({
        baseUrl: 'https://api.example.com',
        apiKey: 'parent-key',
      });
      const unauthChild = base.withConfig({ apiKey: null, authToken: null });

      expect(unauthChild.config.apiKey).toBeUndefined();
      expect(unauthChild.config.authToken).toBeUndefined();

      const headers = unauthChild.config.toHeaders?.() ?? {};
      expect(headers['x-api-key']).toBeUndefined();
      expect(headers['authorization']).toBeUndefined();
    } finally {
      process.env.LILY_API_KEY = originalApiKey;
      process.env.LILY_AUTH_TOKEN = originalAuthToken;
    }
  });
});
