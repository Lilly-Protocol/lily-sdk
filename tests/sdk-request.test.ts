import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';
import type { HttpClient, HttpResponse, HttpRequest } from '../src/http/types';

class MockHttpClient implements HttpClient {
  public readonly response: HttpResponse;
  public constructor(response: HttpResponse) {
    this.response = response;
  }
  public request<TResponse>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req: HttpRequest,
  ): Promise<HttpResponse<TResponse>> {
    return Promise.resolve(this.response as HttpResponse<TResponse>);
  }
}

describe('LilySdk.request', () => {
  it('delegates to the shared httpClient and returns data', async () => {
    const mockResponse: HttpResponse<{ value: number }> = {
      data: { value: 42 },
      status: 200,
      headers: new Headers(),
    };

    const mockHttpClient = new MockHttpClient(mockResponse);

    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com' },
      mockHttpClient,
    );

    const result = await sdk.request<{ value: number }>({
      method: 'GET',
      path: '/test',
    });

    expect(result).toEqual({ value: 42 });
  });

  it('passes request body through to the transport', async () => {
    const mockResponse: HttpResponse<string> = {
      data: 'ok',
      status: 200,
      headers: new Headers(),
    };

    const mockHttpClient = new MockHttpClient(mockResponse);

    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com' },
      mockHttpClient,
    );

    const result = await sdk.request<string, { name: string }>({
      method: 'POST',
      path: '/items',
      body: { name: 'widget' },
    });

    expect(result).toBe('ok');
  });
});
