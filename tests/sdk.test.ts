import { describe, expect, it, vi } from 'vitest';
import type { HttpClient, HttpRequest } from '../src/http/types';

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

describe('LilySdk.request() passthrough', () => {
  it('delegates to the shared HttpClient and returns response data', async () => {
    const requestSpy = vi.fn((req: HttpRequest) =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: { id: 'custom-1', value: 42 },
      }),
    );
    const mockClient: HttpClient = {
      request: requestSpy as HttpClient['request'],
    };
    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      mockClient,
    );

    const result = await sdk.request<{ id: string; value: number }>({
      method: 'GET',
      path: '/v1/custom-endpoint',
      query: { filter: 'active' },
    });

    expect(result).toEqual({ id: 'custom-1', value: 42 });
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/custom-endpoint',
      query: { filter: 'active' },
    });
  });

  it('passes request body through to the transport', async () => {
    let capturedBody: unknown;
    const mockClient: HttpClient = {
      request: ((req: HttpRequest) => {
        capturedBody = req.body;
        return Promise.resolve({
          status: 201,
          headers: new Headers(),
          data: { created: true },
        });
      }) as HttpClient['request'],
    };
    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      mockClient,
    );

    await sdk.request<{ created: boolean }, { name: string }>({
      method: 'POST',
      path: '/v1/resources',
      body: { name: 'test-resource' },
    });

    expect(capturedBody).toEqual({ name: 'test-resource' });
  });
});
