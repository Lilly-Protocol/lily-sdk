import { describe, expect, it } from 'vitest';

import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function createConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: globalThis.fetch,
    ...overrides,
  };
}

describe('buildUrl — query serialization and value encoding', () => {
  // We test buildUrl indirectly through the fetch client by checking
  // the URL passed to the fetch implementation.

  it('serializes string query params', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/agents',
      query: { name: 'agent-001' },
    });

    expect(capturedUrl).toBeDefined();
    expect(capturedUrl!.searchParams.get('name')).toBe('agent-001');
  });

  it('serializes number query params as strings', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/agents',
      query: { page: 5, limit: 20 },
    });

    expect(capturedUrl!.searchParams.get('page')).toBe('5');
    expect(capturedUrl!.searchParams.get('limit')).toBe('20');
  });

  it('serializes boolean query params as strings', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/agents',
      query: { active: true, verified: false },
    });

    expect(capturedUrl!.searchParams.get('active')).toBe('true');
    expect(capturedUrl!.searchParams.get('verified')).toBe('false');
  });

  it('omits undefined query params', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/agents',
      query: { name: 'test', page: undefined, limit: 10 },
    });

    expect(capturedUrl!.searchParams.has('page')).toBe(false);
    expect(capturedUrl!.searchParams.get('name')).toBe('test');
    expect(capturedUrl!.searchParams.get('limit')).toBe('10');
  });

  it('encodes special characters in query values', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/agents',
      query: { search: 'hello world & foo=bar' },
    });

    expect(capturedUrl!.searchParams.get('search')).toBe('hello world & foo=bar');
  });

  it('handles empty query object', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/system/health',
      query: {},
    });

    expect(capturedUrl!.search).toBe('');
  });

  it('handles undefined query (no query at all)', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy as any }));
    await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(capturedUrl!.search).toBe('');
  });

  it('combines path with baseUrl correctly', async () => {
    let capturedUrl: URL | undefined;
    const fetchSpy = (_input: URL | RequestInfo, _init?: RequestInit) => {
      capturedUrl = _input as URL;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
    };

    const client = createFetchHttpClient(createConfig({
      baseUrl: new URL('https://api.lily.test/'),
      fetch: fetchSpy as any,
    }));
    await client.request({
      method: 'GET',
      path: '/v1/wallets/w-1',
    });

    expect(capturedUrl!.href).toBe('https://api.lily.test/v1/wallets/w-1');
  });
});
