import { describe, expect, it, vi } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('createFetchHttpClient', () => {
  it('does not abort a slow response when the request timeout is disabled', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (_input, init) => {
      expect(init?.signal).toBeUndefined();

      await new Promise((resolve) => setTimeout(resolve, 25));

      return new Response(JSON.stringify({ settled: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const client = createFetchHttpClient(
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch,
      }),
    );

    await expect(
      client.request<{ settled: boolean }>({
        method: 'GET',
        path: '/payments/settlement',
        timeoutMs: 0,
      }),
    ).resolves.toMatchObject({
      status: 200,
      data: { settled: true },
    });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
