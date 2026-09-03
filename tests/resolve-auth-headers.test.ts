import { describe, expect, it } from 'vitest';
import { resolveAuthHeaders } from '../src/http/resolve-auth-headers';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function makeConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com/'),
    timeoutMs: 10_000,
    retry: { retries: 2, retryDelayMs: 250, retryableStatusCodes: [429] },
    defaultHeaders: {},
    userAgent: 'test-agent',
    fetch: globalThis.fetch,
    ...overrides,
  };
}

describe('resolveAuthHeaders', () => {
  it('returns empty headers when no auth is configured', () => {
    const config = makeConfig();
    const headers = resolveAuthHeaders(config);

    expect(headers).toEqual({});
  });

  it('sets x-api-key header when only apiKey is provided', () => {
    const config = makeConfig({ apiKey: 'sk-test-key' });
    const headers = resolveAuthHeaders(config);

    expect(headers).toEqual({ 'x-api-key': 'sk-test-key' });
    expect(headers.authorization).toBeUndefined();
  });

  it('sets authorization bearer header when only authToken is provided', () => {
    const config = makeConfig({ authToken: 'tok-test-token' });
    const headers = resolveAuthHeaders(config);

    expect(headers).toEqual({ authorization: 'Bearer tok-test-token' });
    expect(headers['x-api-key']).toBeUndefined();
  });

  it('sets both headers when apiKey and authToken are provided', () => {
    const config = makeConfig({ apiKey: 'sk-both', authToken: 'tok-both' });
    const headers = resolveAuthHeaders(config);

    expect(headers).toEqual({
      'x-api-key': 'sk-both',
      authorization: 'Bearer tok-both',
    });
  });
});
