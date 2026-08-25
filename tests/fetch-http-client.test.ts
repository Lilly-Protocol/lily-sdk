import { describe, expect, it, vi } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyApiError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function jsonResponse(status: number): Response {
  return new Response(JSON.stringify({ status }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createFetchHttpClient retry policy', () => {
  it('retries statuses from the default retry policy', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200));
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      retry: { retryDelayMs: 0 },
      fetch,
    });
    const client = createFetchHttpClient(config);

    const response = await client.request({ method: 'GET', path: '/health' });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      retryableStatusCodes: [429],
      description: 'a custom policy excluding the status',
    },
    { retryableStatusCodes: [], description: 'an empty status policy' },
  ])(
    'does not retry 503 with $description',
    async ({ retryableStatusCodes }) => {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(jsonResponse(503));
      const config = resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        retry: { retries: 2, retryDelayMs: 0, retryableStatusCodes },
        fetch,
      });
      const client = createFetchHttpClient(config);

      await expect(
        client.request({ method: 'GET', path: '/health' }),
      ).rejects.toBeInstanceOf(LilyApiError);
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
});
