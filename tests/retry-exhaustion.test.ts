import { describe, expect, it, vi } from 'vitest';

import { LilyApiError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function create503Response(): Response {
  return new Response(JSON.stringify({ message: 'Service Unavailable' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  });
}

function createConfig(fetchSpy: ReturnType<typeof vi.fn>) {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 5_000,
    retry: {
      retries: 2,
      retryDelayMs: 0,
      retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: fetchSpy,
  };
}

describe('retry exhaustion', () => {
  it('makes exactly retries + 1 attempts when GET always returns 503', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(create503Response()));

    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toBeInstanceOf(LilyApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('surfaces LilyApiError with statusCode 503 on exhaustion', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(create503Response()));

    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toMatchObject({
      name: 'LilyApiError',
      statusCode: 503,
    });
  });

  it('does not retry non-idempotent POST requests on 503', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(create503Response()));

    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    await expect(
      httpClient.request({
        method: 'POST',
        path: '/v1/resources',
        body: { name: 'test' },
      }),
    ).rejects.toBeInstanceOf(LilyApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry GET on non-retryable status (400)', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Bad Request' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toBeInstanceOf(LilyApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('succeeds on the final retry attempt', async () => {
    let callCount = 0;
    const fetchSpy = vi.fn(() => {
      callCount += 1;
      if (callCount < 3) {
        return Promise.resolve(create503Response());
      }
      return Promise.resolve(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    const httpClient = createFetchHttpClient(createConfig(fetchSpy));

    const response = await httpClient.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
