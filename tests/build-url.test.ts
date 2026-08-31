import { describe, it, expect } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('buildUrl query serialization', () => {
  function captureRequest(baseUrl: string) {
    let capturedUrl: string | undefined;
    const mockFetch = (url: string | URL | Request) =>
      Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ).then((res) => {
        capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        return res;
      });

    const config = resolveLilySdkConfig({
      baseUrl,
      fetch: mockFetch,
    });
    const client = createFetchHttpClient(config);

    return {
      client,
      getCapturedUrl: () => capturedUrl,
    };
  }

  it('omits undefined query values', async () => {
    const { client, getCapturedUrl } = captureRequest('https://api.example.com');
    await client.request({
      method: 'GET',
      path: '/test',
      query: { a: '1', b: undefined, c: '3' },
    });
    const url = new URL(getCapturedUrl() ?? '');
    expect(url.searchParams.has('a')).toBe(true);
    expect(url.searchParams.get('a')).toBe('1');
    expect(url.searchParams.has('b')).toBe(false);
    expect(url.searchParams.has('c')).toBe(true);
    expect(url.searchParams.get('c')).toBe('3');
  });

  it('percent-encodes special characters', async () => {
    const { client, getCapturedUrl } = captureRequest('https://api.example.com');
    await client.request({
      method: 'GET',
      path: '/test',
      query: { email: 'user@example.com', q: 'hello world&foo=bar' },
    });
    const raw = getCapturedUrl() ?? '';
    expect(raw).toContain('user%40example.com');
    expect(raw).toContain('hello+world%26foo%3Dbar');
  });

  it('coerces numeric and boolean values to strings', async () => {
    const { client, getCapturedUrl } = captureRequest('https://api.example.com');
    await client.request({
      method: 'GET',
      path: '/test',
      query: { count: 42, active: true, disabled: false },
    });
    const url = new URL(getCapturedUrl() ?? '');
    expect(url.searchParams.get('count')).toBe('42');
    expect(url.searchParams.get('active')).toBe('true');
    expect(url.searchParams.get('disabled')).toBe('false');
  });

  it('handles base URL with trailing slash', async () => {
    const { client, getCapturedUrl } = captureRequest('https://api.example.com/');
    await client.request({
      method: 'GET',
      path: '/v1/resource',
      query: { id: '1' },
    });
    expect(getCapturedUrl()).toBe('https://api.example.com/v1/resource?id=1');
  });

  it('handles base URL without trailing slash', async () => {
    const { client, getCapturedUrl } = captureRequest('https://api.example.com');
    await client.request({
      method: 'GET',
      path: '/v1/resource',
      query: { id: '1' },
    });
    expect(getCapturedUrl()).toBe('https://api.example.com/v1/resource?id=1');
  });

  it('handles path without leading slash', async () => {
    const { client, getCapturedUrl } = captureRequest('https://api.example.com');
    await client.request({
      method: 'GET',
      path: 'v1/resource',
      query: { id: '1' },
    });
    expect(getCapturedUrl()).toBe('https://api.example.com/v1/resource?id=1');
  });
});
