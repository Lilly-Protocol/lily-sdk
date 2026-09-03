import { describe, expect, it, vi } from 'vitest';

import {
  LilyApiError,
  LilyTransportError,
} from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('fetch-http-client coverage', () => {
  const baseConfig = {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 5_000,
    retry: {
      retries: 2,
      retryDelayMs: 1,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
  };

  it('retries on retryable status codes for GET requests', async () => {
    let calls = 0;
    const fetchSpy = vi.fn(() => {
      calls += 1;
      if (calls < 3) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'unavailable' }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    const res = await client.request({ method: 'GET', path: '/test' });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('throws LilyApiError after retry exhaustion', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'fail' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    await expect(
      client.request({ method: 'GET', path: '/test' }),
    ).rejects.toBeInstanceOf(LilyApiError);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('does not retry POST requests on server errors', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'fail' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    await expect(
      client.request({ method: 'POST', path: '/test', body: { x: 1 } }),
    ).rejects.toBeInstanceOf(LilyApiError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries on transport errors for safe methods', async () => {
    let calls = 0;
    const fetchSpy = vi.fn(() => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new TypeError('network failure'));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    const res = await client.request({ method: 'GET', path: '/test' });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws LilyTransportError after transport retry exhaustion', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.reject(new TypeError('network failure')),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    await expect(
      client.request({ method: 'GET', path: '/test' }),
    ).rejects.toBeInstanceOf(LilyTransportError);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('handles 204 No Content responses', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(null, {
          status: 204,
          headers: {},
        }),
      ),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    const res = await client.request({ method: 'DELETE', path: '/test' });
    expect(res.status).toBe(204);
    expect(res.data).toBeNull();
  });

  it('falls back to text parsing for non-JSON responses', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response('plain text response', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    const res = await client.request({ method: 'GET', path: '/test' });
    expect(res.data).toBe('plain text response');
  });

  it('serializes query parameters correctly in buildUrl', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchSpy = vi.fn((_input: unknown, _init?: unknown) =>
      Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    await client.request({
      method: 'GET',
      path: '/test',
      query: {
        str: 'hello world',
        num: 42,
        bool: true,
        skip: undefined,
      },
    });

    const url = fetchSpy.mock.calls[0]?.[0] as URL | undefined;
    if (!(url instanceof URL)) throw new Error('fetch was not called with URL');
    const calledUrl = url;
    expect(calledUrl.searchParams.get('str')).toBe('hello world');
    expect(calledUrl.searchParams.get('num')).toBe('42');
    expect(calledUrl.searchParams.get('bool')).toBe('true');
    expect(calledUrl.searchParams.has('skip')).toBe(false);
  });

  it('serializes request body as JSON', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fetchSpy = vi.fn((_input: unknown, init?: unknown) =>
      Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const client = createFetchHttpClient({
      ...baseConfig,
      fetch: fetchSpy,
    });

    await client.request({
      method: 'POST',
      path: '/test',
      body: { key: 'value', nested: { a: 1 } },
    });

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = init?.body;
    if (typeof body !== 'string') throw new Error('fetch body was not a string');
    expect(JSON.parse(body)).toEqual({ key: 'value', nested: { a: 1 } });
  });
});
