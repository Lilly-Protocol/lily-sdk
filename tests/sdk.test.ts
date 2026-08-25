import { describe, expect, it } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('LilySdk', () => {
  it('constructs all client modules with shared config', () => {
    const httpClient = createMockHttpClient(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: { ok: true },
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      httpClient,
    );

    expect(sdk.config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(sdk.http).toBe(httpClient);
    expect(sdk.agents).toBeDefined();
    expect(sdk.wallets).toBeDefined();
    expect(sdk.payments).toBeDefined();
    expect(sdk.identity).toBeDefined();
    expect(sdk.system).toBeDefined();
  });

  it('exposes a default HttpClient when none is injected', () => {
    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.test',
      fetch: globalThis.fetch,
    });

    expect(typeof sdk.http.request).toBe('function');
  });
});
