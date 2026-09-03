import { describe, it, expect, vi } from 'vitest';
import { LilySdk } from '../src/sdk';
import type { HttpClient, HttpRequest, HttpResponse } from '../src/http/types';

/**
 * Bounty #78 — $80
 * "Add a typed passthrough `request()` on `LilySdk`"
 */
describe('LilySdk.request() typed passthrough', () => {
  it('LilySdk exposes a request method that passes through to httpClient', async () => {
    const httpClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: { ok: true },
      }),
    };

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
      },
      httpClient,
    );

    const response = await sdk.request({ method: 'GET', path: '/v1/custom' });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });

    const request = (httpClient.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.method).toBe('GET');
    expect(request.path).toBe('/v1/custom');
  });

  it('request method preserves full HttpResponse type', async () => {
    const httpClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 201,
        headers: new Headers({ 'x-trace-id': 'abc' }),
        data: { id: '123' },
      }),
    };

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
      },
      httpClient,
    );

    const response = await sdk.request<{ id: string }>({
      method: 'POST',
      path: '/v1/custom',
      body: { name: 'test' },
    });

    expect(response.status).toBe(201);
    expect(response.data.id).toBe('123');
    expect(response.headers.get('x-trace-id')).toBe('abc');
  });

  it('request method supports custom query params', async () => {
    const httpClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: [],
      }),
    };

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
      },
      httpClient,
    );

    await sdk.request({
      method: 'GET',
      path: '/v1/custom',
      query: { limit: 10, cursor: 'abc' },
    });

    const request = (httpClient.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.query).toEqual({ limit: 10, cursor: 'abc' });
  });
});
