import { describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';
import type { HttpRequest } from '../src/http/types';

describe('LilySdk.request (typed passthrough)', () => {
  it('delegates to the httpClient and returns response.data', async () => {
    const mockData = { status: 'ok', timestamp: 1234567890 };
    const mock = createMockHttpClient(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      mock,
    );

    const result = await sdk.request<{ status: string; timestamp: number }>({
      method: 'GET',
      path: '/health',
    });

    expect(result).toEqual(mockData);
    expect(result.status).toBe('ok');
  });

  it('passes through the full HttpRequest descriptor to the httpClient', async () => {
    const calls: HttpRequest<unknown>[] = [];
    const mock = createMockHttpClient((req) => {
      calls.push(req);
      return Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: { ok: true },
      });
    });

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      mock,
    );

    await sdk.request({
      method: 'POST',
      path: '/webhooks',
      body: { event: 'created' },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.path).toBe('/webhooks');
    expect(calls[0]!.body).toEqual({ event: 'created' });
  });

  it('propagates errors thrown by the httpClient', async () => {
    const mock = createMockHttpClient(() =>
      Promise.reject(new Error('Network failure')),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      mock,
    );

    await expect(
      sdk.request({ method: 'GET', path: '/missing' }),
    ).rejects.toThrow('Network failure');
  });

  it('supports typed request bodies with POST', async () => {
    const mock = createMockHttpClient(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: { id: 'abc123' },
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      mock,
    );

    const result = await sdk.request<{ id: string }, { name: string }>({
      method: 'POST',
      path: '/agents',
      body: { name: 'test-agent' },
    });

    expect(result.id).toBe('abc123');
  });
});
