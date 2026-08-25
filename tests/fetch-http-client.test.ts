import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyApiError, LilyTransportError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { HttpMethod } from '../src/http/types';

function config(
  fetch: typeof globalThis.fetch,
  retries = 0,
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/root/'),
    timeoutMs: 2_000,
    retry: { retries, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: { 'x-default': 'default' },
    userAgent: 'lily-sdk/test',
    fetch,
  };
}

function jsonResponse(status: number, body: unknown = { ok: true }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetch HTTP client', () => {
  const retryableStatuses = [408, 409, 425, 429, 500, 502, 503, 504];
  const retryableMethods: HttpMethod[] = ['GET', 'PUT', 'DELETE'];

  it.each(
    retryableMethods.flatMap((method) =>
      retryableStatuses.map((status) => [method, status] as const),
    ),
  )('retries %s requests after status %i', async (method, status) => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(jsonResponse(status))
      .mockResolvedValueOnce(jsonResponse(200));

    const response = await createFetchHttpClient(config(fetch, 1)).request({
      method,
      path: '/v1/resource',
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['POST', 'PATCH'] as const)(
    'does not retry non-idempotent %s requests',
    async (method) => {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(jsonResponse(503));

      await expect(
        createFetchHttpClient(config(fetch, 1)).request({
          method,
          path: '/v1/resource',
        }),
      ).rejects.toBeInstanceOf(LilyApiError);
      expect(fetch).toHaveBeenCalledOnce();
    },
  );

  it('stops retrying status failures at the configured limit', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(() => Promise.resolve(jsonResponse(503)));

    await expect(
      createFetchHttpClient(config(fetch, 1)).request({
        method: 'GET',
        path: '/v1/resource',
      }),
    ).rejects.toMatchObject({ code: 'API_ERROR', statusCode: 503 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(retryableMethods)(
    'retries transport errors for %s requests',
    async (method) => {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockRejectedValueOnce(new TypeError('connection reset'))
        .mockResolvedValueOnce(jsonResponse(200));

      await expect(
        createFetchHttpClient(config(fetch, 1)).request({
          method,
          path: '/v1/resource',
        }),
      ).resolves.toMatchObject({ status: 200 });
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it('wraps exhausted and non-Error transport failures', async () => {
    const exhaustedFetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValue(new TypeError('connection reset'));
    await expect(
      createFetchHttpClient(config(exhaustedFetch, 1)).request({
        method: 'GET',
        path: '/v1/resource',
      }),
    ).rejects.toMatchObject({ code: 'TRANSPORT_ERROR' });
    expect(exhaustedFetch).toHaveBeenCalledTimes(2);

    const nonErrorFetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValue('offline');
    await expect(
      createFetchHttpClient(config(nonErrorFetch, 1)).request({
        method: 'GET',
        path: '/v1/resource',
      }),
    ).rejects.toBeInstanceOf(LilyTransportError);
    expect(nonErrorFetch).toHaveBeenCalledOnce();
  });

  it('does not retry transport errors for non-idempotent methods', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValue(new TypeError('offline'));

    await expect(
      createFetchHttpClient(config(fetch, 1)).request({
        method: 'POST',
        path: '/v1/resource',
      }),
    ).rejects.toBeInstanceOf(LilyTransportError);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('builds the URL and serializes request bodies', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(jsonResponse(200));

    await createFetchHttpClient(config(fetch)).request({
      method: 'POST',
      path: 'v1/resource',
      query: {
        text: 'hello world',
        page: 2,
        enabled: false,
        omitted: undefined,
      },
      headers: { 'x-request': 'request' },
      body: { amount: 12 },
    });

    const call = fetch.mock.calls.at(0);
    if (!call) {
      throw new Error('Expected fetch to be called');
    }
    const [url, init] = call;
    if (!(url instanceof URL)) {
      throw new Error('Expected transport URL to be a URL instance');
    }
    expect(url.href).toBe(
      'https://api.lily.test/root/v1/resource?text=hello+world&page=2&enabled=false',
    );
    expect(init?.body).toBe('{"amount":12}');
    expect(init?.headers).toMatchObject({
      'x-default': 'default',
      'x-request': 'request',
    });
  });

  it.each([
    [204, '', null],
    [200, 'plain text', 'plain text'],
  ] as const)(
    'parses a %i non-JSON response',
    async (status, body, expected) => {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(new Response(body || null, { status }));

      const response = await createFetchHttpClient(config(fetch)).request({
        method: 'GET',
        path: '/v1/resource',
        body: null,
      });

      expect(response.data).toBe(expected);
      const call = fetch.mock.calls.at(0);
      if (!call) {
        throw new Error('Expected fetch to be called');
      }
      expect(call[1]?.body).toBeUndefined();
    },
  );

  it('maps abort errors to timeout transport errors', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );

    await expect(
      createFetchHttpClient({ ...config(fetch), timeoutMs: 1 }).request({
        method: 'GET',
        path: '/v1/resource',
      }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
