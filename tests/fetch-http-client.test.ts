import { describe, expect, it } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createClient(response: Response) {
  const config = resolveLilySdkConfig({
    baseUrl: 'https://api.lily.test',
    fetch: () => Promise.resolve(response),
  });

  return createFetchHttpClient(config);
}

describe('createFetchHttpClient response parsing', () => {
  it('returns null data for a 204 response', async () => {
    const client = createClient(new Response(null, { status: 204 }));

    const result = await client.request<null>({
      method: 'GET',
      path: '/resource',
    });

    expect(result.data).toBeNull();
  });

  it('returns the raw body for a text/plain response', async () => {
    const client = createClient(
      new Response('plain response', {
        headers: { 'content-type': 'text/plain' },
      }),
    );

    const result = await client.request<string>({
      method: 'GET',
      path: '/resource',
    });

    expect(result.data).toBe('plain response');
  });

  it('parses an application/json response', async () => {
    const client = createClient(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await client.request<{ ok: boolean }>({
      method: 'GET',
      path: '/resource',
    });

    expect(result.data).toEqual({ ok: true });
  });
});
