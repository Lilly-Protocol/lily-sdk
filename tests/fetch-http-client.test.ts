import { describe, expect, it, vi } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyTransportError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function rejectWhenAborted(
  signal: AbortSignal | null | undefined,
): Promise<Response> {
  return new Promise((_resolve, reject) => {
    signal?.addEventListener('abort', () => {
      const error = new Error('The request was aborted.');
      error.name = 'AbortError';
      reject(error);
    });
  });
}

function createClient(fetch: typeof globalThis.fetch, retries = 1) {
  return createFetchHttpClient(
    resolveLilySdkConfig({
      baseUrl: 'https://api.lily.test',
      timeoutMs: 1,
      retry: { retries, retryDelayMs: 0 },
      fetch,
    }),
  );
}

describe('createFetchHttpClient timeout retries', () => {
  it('retries a timed-out GET while retry budget remains', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementationOnce((_input, init) => rejectWhenAborted(init?.signal))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const client = createClient(fetch);

    await expect(
      client.request({ method: 'GET', path: '/health' }),
    ).resolves.toMatchObject({
      status: 200,
      data: { ok: true },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws TIMEOUT after a GET exhausts its retry budget', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation((_input, init) => {
        return rejectWhenAborted(init?.signal);
      });
    const client = createClient(fetch);

    const request = client.request({ method: 'GET', path: '/health' });

    await expect(request).rejects.toMatchObject({
      code: 'TIMEOUT',
      name: 'LilyTransportError',
    } satisfies Partial<LilyTransportError>);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry a timed-out POST', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation((_input, init) => {
        return rejectWhenAborted(init?.signal);
      });
    const client = createClient(fetch);

    const request = client.request({
      method: 'POST',
      path: '/payments',
      body: {},
    });

    await expect(request).rejects.toMatchObject({
      code: 'TIMEOUT',
    } satisfies Partial<LilyTransportError>);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
