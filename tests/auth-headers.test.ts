import { describe, expect, it } from 'vitest';

import { toHeaders } from '../src/http/auth-headers';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function makeConfig(
  overrides: Partial<ResolvedLilySdkConfig> = {},
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 10_000,
    retry: { retries: 2, retryDelayMs: 250, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: globalThis.fetch,
    ...overrides,
  };
}

describe('toHeaders', () => {
  it('returns only apiKey header when only apiKey is set', () => {
    const headers = toHeaders(makeConfig({ apiKey: 'my-key' }));
    expect(headers).toEqual({ 'x-api-key': 'my-key' });
  });

  it('returns only Authorization header when only authToken is set', () => {
    const headers = toHeaders(makeConfig({ authToken: 'my-token' }));
    expect(headers).toEqual({ authorization: 'Bearer my-token' });
  });

  it('returns both headers when apiKey and authToken are set', () => {
    const headers = toHeaders(makeConfig({ apiKey: 'k', authToken: 't' }));
    expect(headers).toEqual({
      'x-api-key': 'k',
      authorization: 'Bearer t',
    });
  });

  it('returns empty object when neither is set', () => {
    const headers = toHeaders(makeConfig());
    expect(headers).toEqual({});
  });
});
