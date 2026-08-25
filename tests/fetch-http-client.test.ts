import { describe, expect, it, vi } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('createFetchHttpClient', () => {
  it('only sets content-type when the request has a body', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );
    const client = createFetchHttpClient(
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch,
      }),
    );

    await client.request({ method: 'GET', path: '/agents' });
    await client.request({ method: 'POST', path: '/agents', body: { name: 'Lily' } });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL('https://api.lily.test/agents'),
      expect.objectContaining({
        headers: expect.not.objectContaining({ 'content-type': expect.anything() }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL('https://api.lily.test/agents'),
      expect.objectContaining({
        body: JSON.stringify({ name: 'Lily' }),
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
      }),
    );
  });
});
