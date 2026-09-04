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

  it('clears inherited apiKey when overridden with null', () => {
    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'key-1',
    });
    const derived = original.withConfig({ apiKey: null });

    expect(derived.config.apiKey).toBeUndefined();
    expect(original.config.apiKey).toBe('key-1');
    expect(derived.config.toHeaders?.()['x-api-key']).toBeUndefined();
  });

  it('clears inherited authToken when overridden with null', () => {
    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      authToken: 'token-1',
    });
    const derived = original.withConfig({ authToken: null });

    expect(derived.config.authToken).toBeUndefined();
    expect(original.config.authToken).toBe('token-1');
    expect(derived.config.toHeaders?.()['authorization']).toBeUndefined();
  });

  it('clears both credentials and sends neither x-api-key nor Authorization header', async () => {
    let capturedHeaders: Headers | Record<string, string> | undefined;

    const mockFetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedHeaders = init?.headers as any;
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'secret-api-key',
      authToken: 'secret-auth-token',
      fetch: mockFetch as typeof globalThis.fetch,
    });

    const publicChild = original.withConfig({
      apiKey: null,
      authToken: null,
    });

    expect(publicChild.config.apiKey).toBeUndefined();
    expect(publicChild.config.authToken).toBeUndefined();

    await publicChild.http.request({
      method: 'GET',
      path: '/v1/public-endpoint',
    });

    const headers = new Headers(capturedHeaders as any);
    expect(headers.get('x-api-key')).toBeNull();
    expect(headers.get('authorization')).toBeNull();
  });
});

