import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe.each(['https://api.lily.test', 'https://api.lily.test/'])(
  'buildUrl with base URL %s',
  (baseUrl) => {
    it('serializes defined query values and omits undefined values', async () => {
      const fetchSpy = vi.fn<typeof globalThis.fetch>((input) => {
        expect(input).toBeInstanceOf(URL);
        return Promise.resolve(new Response(null, { status: 204 }));
      });
      const config: ResolvedLilySdkConfig = {
        baseUrl: new URL(baseUrl),
        timeoutMs: 2_000,
        retry: {
          retries: 0,
          retryDelayMs: 0,
          retryableStatusCodes: [],
        },
        defaultHeaders: {},
        userAgent: 'lily-sdk/test',
        fetch: fetchSpy,
      };
      const httpClient = createFetchHttpClient(config);

      await httpClient.request({
        method: 'GET',
        path: '/v1/agents',
        query: {
          domain: 'agent@example.com',
          active: true,
          limit: 25,
          cursor: undefined,
        },
      });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const requestUrl = fetchSpy.mock.calls[0]?.[0];
      expect(requestUrl).toBeInstanceOf(URL);
      expect(requestUrl instanceof URL ? requestUrl.href : undefined).toBe(
        'https://api.lily.test/v1/agents?domain=agent%40example.com&active=true&limit=25',
      );
    });
  },
);
