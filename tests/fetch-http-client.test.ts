import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createPendingFetch(): typeof globalThis.fetch {
  return vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const rejectWithAbort = (): void => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      };

      if (signal?.aborted) {
        rejectWithAbort();
      } else {
        signal?.addEventListener('abort', rejectWithAbort, { once: true });
      }
    });
  });
}

function createConfig(fetch: typeof globalThis.fetch): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch,
  };
}

describe('fetch HTTP client cancellation', () => {
  it('cancels an in-flight request with an external signal', async () => {
    const externalController = new AbortController();
    const fetch = createPendingFetch();
    const httpClient = createFetchHttpClient(createConfig(fetch));

    const result = httpClient.request({
      method: 'GET',
      path: '/v1/agents',
      signal: externalController.signal,
    });
    externalController.abort();

    await expect(result).rejects.toMatchObject({
      name: 'LilyTransportError',
      code: 'CANCELLED',
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('distinguishes timeout cancellation from external cancellation', async () => {
    const externalController = new AbortController();
    const httpClient = createFetchHttpClient(
      createConfig(createPendingFetch()),
    );

    const result = httpClient.request({
      method: 'GET',
      path: '/v1/agents',
      timeoutMs: 10,
      signal: externalController.signal,
    });

    await expect(result).rejects.toMatchObject({
      name: 'LilyTransportError',
      code: 'TIMEOUT',
    });

    externalController.abort();
  });

  it('gives external cancellation precedence when it occurs before the timeout', async () => {
    const externalController = new AbortController();
    const httpClient = createFetchHttpClient(
      createConfig(createPendingFetch()),
    );

    const result = httpClient.request({
      method: 'GET',
      path: '/v1/agents',
      timeoutMs: 50,
      signal: externalController.signal,
    });
    externalController.abort();

    await expect(result).rejects.toMatchObject({
      name: 'LilyTransportError',
      code: 'CANCELLED',
    });
  });
});
