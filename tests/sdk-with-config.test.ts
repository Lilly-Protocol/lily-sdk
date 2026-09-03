import { describe, it, expect, vi } from 'vitest';
import { LilySdk } from '../src/sdk';
import type { HttpClient } from '../src/http/types';

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

  it('preserves an injected custom HttpClient across withConfig (issue #442)', async () => {
    const requestSpy = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { status: 'ok' },
    });
    const customClient: HttpClient = {
      request: requestSpy,
    };

    const parent = new LilySdk(
      {
        baseUrl: 'https://api.example.com',
        apiKey: 'parent-key',
      },
      customClient,
    );

    const child = parent.withConfig({ apiKey: 'tenant2' });

    expect(child.httpClient).toBe(customClient);
    expect(child.http).toBe(customClient);

    // Make a request from the child
    await child.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/v1/system/health',
      }),
    );
  });
});
