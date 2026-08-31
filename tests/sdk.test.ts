import { describe, expect, it } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('LilySdk', () => {
  it('constructs all client modules with shared config', () => {
    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(() =>
        Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: { ok: true },
        }),
      ),
    );

    expect(sdk.config.baseUrl.toString()).toBe('https://api.lily.test/');
    expect(sdk.agents).toBeDefined();
    expect(sdk.wallets).toBeDefined();
    expect(sdk.payments).toBeDefined();
    expect(sdk.identity).toBeDefined();
    expect(sdk.system).toBeDefined();
  });
});

describe('LilySdk composition', () => {
  it('routes an injected HttpClient to all five clients', async () => {
    const requests: string[] = [];
    const mockClient = createMockHttpClient((req) => {
      requests.push(req.path);
      return Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: { ok: true },
      });
    });

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      mockClient,
    );

    await sdk.system.health();
    await sdk.agents.list();
    await sdk.wallets.get('w1');
    await sdk.payments.get('p1');
    await sdk.identity.resolve({ identifier: 'i1' });

    expect(requests).toContain('/v1/system/health');
    expect(requests).toContain('/v1/agents');
    expect(requests).toContain('/v1/wallets/w1');
    expect(requests).toContain('/v1/payments/p1');
    expect(requests).toContain('/v1/identity/resolve');
  });

  it('throws LilyConfigError before constructing clients when config is invalid', async () => {
    const { LilyConfigError } = await import('../src/errors/sdk-error');

    expect(() => {
      new LilySdk({ baseUrl: '' });
    }).toThrow(LilyConfigError);
  });
});
