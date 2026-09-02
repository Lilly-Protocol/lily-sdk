import { describe, it, expect } from 'vitest';

// buildUrl is not exported, so we test it indirectly via createFetchHttpClient
// or we can extract and test it if it were exported. Since it's private,
// we test the URL construction behavior through the HTTP client.
// However, issue #33 specifically asks to "Test buildUrl query serialization".
// Let's check if buildUrl is exported or if we need to test via integration.

// Actually, looking at fetch-http-client.ts, buildUrl is a module-private function.
// The bounty likely expects us to either export it for testing or test its effects.
// Given the pattern of other bounties, let's test the observable behavior:
// that query parameters are correctly serialized into the URL passed to fetch.

import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { vi } from 'vitest';

function createMockConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com/v1/'),
    apiKey: 'test-key',
    authToken: undefined,
    userAgent: 'lily-sdk/test',
    defaultHeaders: {},
    timeoutMs: 5000,
    retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
    fetch: vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '{}',
    }),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

describe('buildUrl query serialization', () => {
  it('serializes string query parameters', async () => {
    const config = createMockConfig();
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/agents',
      query: { status: 'active', network: 'stellar-testnet' },
    });

    const calledUrl = vi.mocked(config.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('status')).toBe('active');
    expect(calledUrl.searchParams.get('network')).toBe('stellar-testnet');
  });

  it('serializes numeric query parameters as strings', async () => {
    const config = createMockConfig();
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/agents',
      query: { limit: 10, offset: 20 },
    });

    const calledUrl = vi.mocked(config.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('limit')).toBe('10');
    expect(calledUrl.searchParams.get('offset')).toBe('20');
  });

  it('serializes boolean query parameters as strings', async () => {
    const config = createMockConfig();
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/agents',
      query: { active: true, deleted: false },
    });

    const calledUrl = vi.mocked(config.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('active')).toBe('true');
    expect(calledUrl.searchParams.get('deleted')).toBe('false');
  });

  it('omits undefined query parameters', async () => {
    const config = createMockConfig();
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/agents',
      query: { status: 'active', network: undefined },
    });

    const calledUrl = vi.mocked(config.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.has('status')).toBe(true);
    expect(calledUrl.searchParams.has('network')).toBe(false);
  });

  it('handles empty query object without adding ?', async () => {
    const config = createMockConfig();
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/agents',
      query: {},
    });

    const calledUrl = vi.mocked(config.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.search).toBe('');
  });

  it('combines base URL path with request path correctly', async () => {
    const config = createMockConfig({ baseUrl: new URL('https://api.example.com/v1/') });
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/agents',
      query: { limit: 5 },
    });

    const calledUrl = vi.mocked(config.fetch).mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe('/v1/agents');
    expect(calledUrl.origin).toBe('https://api.example.com');
  });
});
