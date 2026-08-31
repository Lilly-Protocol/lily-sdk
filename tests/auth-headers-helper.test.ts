import { describe, expect, it } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { resolveAuthHeaders } from '../src/http/auth-headers';

describe('resolveAuthHeaders', () => {
  const base = {
    baseUrl: 'https://api.lily.test',
    timeoutMs: 2_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
  };

  it('returns only x-api-key when only apiKey is set', () => {
    const config = resolveLilySdkConfig({ ...base, apiKey: 'k1' });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({ 'x-api-key': 'k1' });
  });

  it('returns only authorization bearer when only authToken is set', () => {
    const config = resolveLilySdkConfig({ ...base, authToken: 't1' });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({ authorization: 'Bearer t1' });
  });

  it('returns both headers when both credentials are set', () => {
    const config = resolveLilySdkConfig({ ...base, apiKey: 'k1', authToken: 't1' });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({
      'x-api-key': 'k1',
      authorization: 'Bearer t1',
    });
  });

  it('returns empty object when no credentials are set', () => {
    const config = resolveLilySdkConfig({ ...base });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({});
  });
});
