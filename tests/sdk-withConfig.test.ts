import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';
import type { HttpClient, HttpRequest } from '../src/http/types';

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

  it('preserves an injected custom HttpClient across withConfig (issue #442)', async () => {
    const calls: string[] = [];
    const mockHttpClient: HttpClient = {
      request: (request: HttpRequest) => {
        calls.push(request.path);
        return Promise.resolve({
          status: 200,
          data: { tenant: 'injected-client' },
          headers: {},
        });
      },
    } as unknown as HttpClient;

    const sdk = new LilySdk(baseConfig, mockHttpClient);
    const tenantSdk = sdk.withConfig({ apiKey: 'tenant2' });

    // The child instance must route through the parent's injected client.
    expect(tenantSdk.httpClient).toBe(mockHttpClient);

    const result = await tenantSdk.request<{ tenant: string }>({
      method: 'GET',
      path: '/v1/agents',
    });
    expect(calls).toEqual(['/v1/agents']);
    expect(result.tenant).toBe('injected-client');
  });

  it('rebuilds the default fetch client when none was injected (issue #405 semantics)', async () => {
    const sdk = new LilySdk(baseConfig);
    const derived = sdk.withConfig({ baseUrl: 'https://tenant.example.com' });

    // The derived instance must NOT share the source transport, otherwise
    // the baseUrl override would never reach the request closure.
    expect(derived.httpClient).not.toBe(sdk.httpClient);

    const fetchCalls: URL[] = [];
    const trackingFetch: typeof fetch = ((input: RequestInfo | URL) => {
      fetchCalls.push(new URL(String(input)));
      return Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }) as unknown as typeof fetch;

    const routed = new LilySdk({
      baseUrl: 'https://api.example.com',
      fetch: trackingFetch,
    });
    const tenant = routed.withConfig({
      baseUrl: 'https://tenant.example.com',
      apiKey: 'tenant-key',
    });
    await tenant.request({ method: 'GET', path: '/v1/ping' });
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].origin).toBe('https://tenant.example.com');
  });

  it('does not mutate the original SDK instance', () => {
    const sdk = new LilySdk(baseConfig);
    const originalApiKey = sdk.config.apiKey;

    sdk.withConfig({ apiKey: 'mutated-key' });

    expect(sdk.config.apiKey).toBe(originalApiKey);
  });
});
