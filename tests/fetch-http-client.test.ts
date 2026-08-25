import { describe, expect, it } from 'vitest';

import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('createFetchHttpClient', () => {
  it.each([
    ['a pre-serialized string', '{"message":"hello"}', '{"message":"hello"}'],
    ['an object', { message: 'hello' }, '{"message":"hello"}'],
    ['an undefined body', undefined, undefined],
    ['a null body', null, undefined],
  ])('serializes %s correctly', async (_description, body, expectedBody) => {
    let sentBody: BodyInit | null | undefined;
    const fetch = ((_input: URL | RequestInfo, init?: RequestInit) => {
      sentBody = init?.body;
      return Promise.resolve(
        new Response('null', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }) as typeof globalThis.fetch;
    const client = createFetchHttpClient(
      resolveLilySdkConfig({
        baseUrl: 'https://api.lily.test',
        fetch,
      }),
    );

    await client.request({
      method: 'POST',
      path: '/messages',
      body,
    });

    expect(sentBody).toBe(expectedBody);
  });
});
