import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyApiError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createConfig(
  fetch: ResolvedLilySdkConfig['fetch'],
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 1,
      retryDelayMs: 0,
      retryableStatusCodes: [500],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch,
  };
}

function serverErrorResponse(): Response {
  return new Response(JSON.stringify({ message: 'server error' }), {
    status: 500,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('fetch HTTP client retries', () => {
  it('does not retry POST requests on retryable status codes', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(serverErrorResponse()));
    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    const request = httpClient.request({
      method: 'POST',
      path: '/v1/payments/execute',
      body: { amount: '10.00' },
    });

    await expect(request).rejects.toMatchObject({
      statusCode: 500,
    });
    await expect(request).rejects.toBeInstanceOf(LilyApiError);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('retries GET requests on retryable status codes', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(serverErrorResponse()));
    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toBeInstanceOf(LilyApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
