import { describe, expect, it, vi } from 'vitest';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LILY_ERROR_CODES, LilyApiError } from '../src/errors/sdk-error';

function createConfig(
  overrides: Record<string, unknown> = {},
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: vi.fn<typeof globalThis.fetch>(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

describe('fetch-http-client — non-2xx JSON parse errors', () => {
  it('throws LilyApiError (not ValidationError) on malformed JSON body with 500 status', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response('not-json', {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));
    try {
      await client.request({ method: 'GET', path: '/v1/fail' });
      expect.fail('should have thrown');
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(LilyApiError);
      expect((e as LilyApiError).statusCode).toBe(500);
      expect((e as LilyApiError).code).toBe(LILY_ERROR_CODES.API_ERROR);
    }
  });

  it('still throws ValidationError on malformed JSON body with 200 status', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response('not-json', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));
    try {
      await client.request({ method: 'GET', path: '/v1/fail' });
      expect.fail('should have thrown');
    } catch (e: unknown) {
      expect(e).not.toBeInstanceOf(LilyApiError);
    }
  });
});
