import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function createMockConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
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

describe('defaultHeaders merging', () => {
  it('includes default headers in every request', async () => {
    const config = createMockConfig({
      defaultHeaders: { 'x-custom-header': 'custom-value' },
    });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/v1/test' });

    const calledInit = vi.mocked(config.fetch).mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['x-custom-header']).toBe('custom-value');
  });

  it('merges default headers with standard headers', async () => {
    const config = createMockConfig({
      defaultHeaders: { 'x-org-id': 'org-123' },
    });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/v1/test' });

    const calledInit = vi.mocked(config.fetch).mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['accept']).toBe('application/json');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['user-agent']).toBe('lily-sdk/test');
    expect(headers['x-org-id']).toBe('org-123');
  });

  it('allows request headers to override default headers', async () => {
    const config = createMockConfig({
      defaultHeaders: { 'x-priority': 'low' },
    });
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/v1/test',
      headers: { 'x-priority': 'high' },
    });

    const calledInit = vi.mocked(config.fetch).mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['x-priority']).toBe('high');
  });

  it('includes api key header when configured', async () => {
    const config = createMockConfig({ apiKey: 'my-secret-key' });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/v1/test' });

    const calledInit = vi.mocked(config.fetch).mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('my-secret-key');
  });

  it('includes authorization header when auth token is configured', async () => {
    const config = createMockConfig({ authToken: 'bearer-token-xyz' });
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: '/v1/test' });

    const calledInit = vi.mocked(config.fetch).mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['authorization']).toBe('Bearer bearer-token-xyz');
  });

  it('request headers take precedence over api key and auth token', async () => {
    const config = createMockConfig({
      apiKey: 'default-key',
      authToken: 'default-token',
    });
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/v1/test',
      headers: {
        'x-api-key': 'override-key',
        authorization: 'Bearer override-token',
      },
    });

    const calledInit = vi.mocked(config.fetch).mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('default-key');
    expect(headers['authorization']).toBe('Bearer default-token');
  });
});
