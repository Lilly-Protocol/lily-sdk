import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

interface AuthConfig {
  apiKey?: string;
  authToken?: string;
}

const matrix: { name: string; config: AuthConfig; expectedHeaders: Record<string, string | undefined> }[] = [
  {
    name: 'apiKey only',
    config: { apiKey: 'test-key' },
    expectedHeaders: { 'x-api-key': 'test-key', authorization: undefined },
  },
  {
    name: 'authToken only',
    config: { authToken: 'test-token' },
    expectedHeaders: { 'x-api-key': undefined, authorization: 'Bearer test-token' },
  },
  {
    name: 'both credentials',
    config: { apiKey: 'test-key', authToken: 'test-token' },
    expectedHeaders: { 'x-api-key': 'test-key', authorization: 'Bearer test-token' },
  },
  {
    name: 'neither credential',
    config: {},
    expectedHeaders: { 'x-api-key': undefined, authorization: undefined },
  },
];

describe('auth header matrix', () => {
  it.each(matrix)('sends correct headers for $name', async ({ config, expectedHeaders }) => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const baseConfig = {
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    };

    const sdkConfig = {
      ...baseConfig,
      ...(config.apiKey !== undefined ? { apiKey: config.apiKey } : {}),
      ...(config.authToken !== undefined ? { authToken: config.authToken } : {}),
    } as ResolvedLilySdkConfig;

    const httpClient = createFetchHttpClient(sdkConfig);

    await httpClient.request({ method: 'GET', path: '/v1/system/health' });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const callArgs = fetchSpy.mock.calls[0] as unknown as [unknown, RequestInit | undefined];
    const init = callArgs[1];
    const headers = (init?.headers ?? {}) as Record<string, string | undefined>;

    if (expectedHeaders['x-api-key'] === undefined) {
      expect(headers['x-api-key']).toBeUndefined();
    } else {
      expect(headers['x-api-key']).toBe(expectedHeaders['x-api-key']);
    }

    if (expectedHeaders.authorization === undefined) {
      expect(headers.authorization).toBeUndefined();
    } else {
      expect(headers.authorization).toBe(expectedHeaders.authorization);
    }
  });
});
