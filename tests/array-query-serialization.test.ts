import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

/**
 * Bounty #66 — $85
 * "Support array values in query string serialization"
 *
 * Tests that array query parameters are serialized correctly
 * (e.g. `?tags=a&tags=b` or `?tags[]=a&tags[]=b`).
 */
describe('array values in query string serialization', () => {
  function createConfigWithFetch(fetchImpl: typeof globalThis.fetch): ResolvedLilySdkConfig {
    return {
      baseUrl: new URL('https://api.example.com/'),
      timeoutMs: 5000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [429] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: fetchImpl,
      toHeaders: () => ({ accept: 'application/json' }),
    };
  }

  it('serializes array query params by repeating the key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      query: { tags: ['a', 'b', 'c'] },
    });

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.getAll('tags')).toEqual(['a', 'b', 'c']);
  });

  it('handles mixed scalar and array params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      query: { page: 1, tags: ['x', 'y'] },
    });

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.getAll('tags')).toEqual(['x', 'y']);
  });

  it('handles empty arrays by omitting the param', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      query: { tags: [] },
    });

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.has('tags')).toBe(false);
  });

  it('handles number arrays', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      query: { ids: [1, 2, 3] },
    });

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.getAll('ids')).toEqual(['1', '2', '3']);
  });

  it('handles mixed array of numbers and strings', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      query: { filter: ['active', 42] },
    });

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.getAll('filter')).toEqual(['active', '42']);
  });

  it('preserves undefined values (omits them)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      query: { page: undefined, tags: ['a'] },
    });

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.has('page')).toBe(false);
    expect(url.searchParams.getAll('tags')).toEqual(['a']);
  });
});
