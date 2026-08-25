import { describe, expect, it } from 'vitest';

// buildUrl is module-private; exercise it through the exported client factory by
// intercepting the fetch call and reading the resolved request URL.
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

interface CapturedRequest {
  url: URL;
  init: RequestInit;
}

function makeFetch(captured: CapturedRequest[]): typeof globalThis.fetch {
  const impl = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const raw = input as RequestInfo;
    const url = new URL(typeof raw === 'string' ? raw : raw instanceof URL ? raw.href : raw.url);
    captured.push({ url, init: init ?? {} });
    return Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  };
  return impl;
}

const BASE = 'https://api.lily.test/';

function makeClient(baseUrl: string = BASE) {
  const captured: CapturedRequest[] = [];
  const config = {
    baseUrl: new URL(baseUrl),
    timeoutMs: 5_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'test-agent',
    fetch: makeFetch(captured),
  } satisfies ResolvedLilySdkConfig;
  const client = createFetchHttpClient(config);
  return { captured, client };
}

function firstUrlOf(captured: CapturedRequest[]): URL {
  const first = captured[0];
  if (!first) {
    throw new Error('expected at least one captured request');
  }
  return first.url;
}

describe('buildUrl query serialization', () => {
  it('omits undefined values from the query string', async () => {
    const { captured, client } = makeClient();
    await client.request({
      method: 'GET',
      path: '/v1/things',
      query: { present: 'yes', missing: undefined },
    });
    const url = firstUrlOf(captured);
    expect(url.searchParams.get('present')).toBe('yes');
    expect(url.searchParams.has('missing')).toBe(false);
  });

  it('percent-encodes special characters in values', async () => {
    const { captured, client } = makeClient();
    await client.request({
      method: 'GET',
      path: '/v1/agents',
      query: { domain: 'lily@protocol' },
    });
    const url = firstUrlOf(captured);
    // '@' must not appear raw in a query value per WHATWG URL serialization
    expect(url.searchParams.get('domain')).toBe('lily@protocol');
    expect(url.href).toContain('domain=lily%40protocol');
  });

  it('coerces boolean and numeric values to strings', async () => {
    const { captured, client } = makeClient();
    await client.request({
      method: 'GET',
      path: '/v1/wallets',
      query: { active: true, limit: 25, ratio: 0.5 },
    });
    const url = firstUrlOf(captured);
    expect(url.searchParams.get('active')).toBe('true');
    expect(url.searchParams.get('limit')).toBe('25');
    expect(url.searchParams.get('ratio')).toBe('0.5');
  });

  it('keeps mixed defined/undefined entries consistent', async () => {
    const { captured, client } = makeClient();
    await client.request({
      method: 'GET',
      path: '/v1/payments',
      query: { a: undefined, b: false, c: undefined, d: 7 },
    });
    const url = firstUrlOf(captured);
    expect([...url.searchParams.keys()].sort()).toEqual(['b', 'd']);
  });

  it('handles base URLs with an existing path prefix', async () => {
    const { captured, client } = makeClient('https://api.lily.test/api/v2/');
    await client.request({ method: 'GET', path: '/things', query: { q: 'x' } });
    const href = firstUrlOf(captured).href;
    expect(href.startsWith('https://api.lily.test/api/v2/')).toBe(true);
    expect(href.endsWith('/things?q=x')).toBe(true);
  });
});
