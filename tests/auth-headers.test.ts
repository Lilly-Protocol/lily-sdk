import { describe, expect, it, vi } from 'vitest';

import type { HttpHeaders } from '../src/http/types';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

/**
 * Pins the behaviour documented under "Authentication" in the README. These
 * exist so the documented precedence cannot drift away from the transport
 * without a test failing.
 */
async function sentHeaders(options: {
  apiKey?: string;
  authToken?: string;
  defaultHeaders?: HttpHeaders;
  requestHeaders?: HttpHeaders;
}): Promise<HttpHeaders> {
  let seen: HttpHeaders = {};

  const fetchSpy = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
    seen = (init?.headers ?? {}) as HttpHeaders;

    return Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });

  const client = createFetchHttpClient({
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: options.defaultHeaders ?? {},
    userAgent: 'lily-sdk/test',
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.authToken === undefined ? {} : { authToken: options.authToken }),
    fetch: fetchSpy,
  });

  await client.request({
    method: 'GET',
    path: '/v1/system/health',
    ...(options.requestHeaders === undefined ? {} : { headers: options.requestHeaders }),
  });

  return seen;
}

describe('auth headers', () => {
  it('sends authToken as a bearer authorization header', async () => {
    const headers = await sentHeaders({ authToken: 'tok' });

    expect(headers.authorization).toBe('Bearer tok');
    expect(headers['x-api-key']).toBeUndefined();
  });

  it('sends apiKey as x-api-key', async () => {
    const headers = await sentHeaders({ apiKey: 'key' });

    expect(headers['x-api-key']).toBe('key');
    expect(headers.authorization).toBeUndefined();
  });

  it('sends both when both are configured', async () => {
    // They are independent credentials, not alternatives: neither wins.
    const headers = await sentHeaders({ authToken: 'tok', apiKey: 'key' });

    expect(headers.authorization).toBe('Bearer tok');
    expect(headers['x-api-key']).toBe('key');
  });

  it('omits a credential that is an empty string', async () => {
    const headers = await sentHeaders({ apiKey: '', authToken: 'tok' });

    expect(headers['x-api-key']).toBeUndefined();
    expect(headers.authorization).toBe('Bearer tok');
  });

  it('sends neither header when neither is configured', async () => {
    const headers = await sentHeaders({});

    expect(headers.authorization).toBeUndefined();
    expect(headers['x-api-key']).toBeUndefined();
  });

  it('lets the configured authToken overwrite a per-request authorization header', async () => {
    // The opposite of the usual per-request-wins convention. Documented in the
    // README because it will surprise people.
    const headers = await sentHeaders({
      authToken: 'from-config',
      requestHeaders: { authorization: 'Bearer from-request' },
    });

    expect(headers.authorization).toBe('Bearer from-config');
  });

  it('lets the configured apiKey overwrite a per-request x-api-key header', async () => {
    const headers = await sentHeaders({
      apiKey: 'from-config',
      requestHeaders: { 'x-api-key': 'from-request' },
    });

    expect(headers['x-api-key']).toBe('from-config');
  });

  it('lets the configured authToken overwrite defaultHeaders', async () => {
    const headers = await sentHeaders({
      authToken: 'from-config',
      defaultHeaders: { authorization: 'Bearer from-defaults' },
    });

    expect(headers.authorization).toBe('Bearer from-config');
  });

  it('still lets a per-request authorization through when no credential is configured', async () => {
    // The documented escape hatch: build a client without authToken/apiKey.
    const headers = await sentHeaders({
      requestHeaders: { authorization: 'Bearer from-request' },
    });

    expect(headers.authorization).toBe('Bearer from-request');
  });

  it('leaves non-auth request headers alone', async () => {
    const headers = await sentHeaders({
      authToken: 'tok',
      requestHeaders: { 'x-request-id': 'abc' },
    });

    expect(headers['x-request-id']).toBe('abc');
    expect(headers.authorization).toBe('Bearer tok');
  });
});
