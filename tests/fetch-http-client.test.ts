import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyApiError, LilyAuthenticationError, LilyTransportError } from '../src/errors/sdk-error';

function makeConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: 'test-key',
    authToken: undefined,
    userAgent: 'lily-sdk/test',
    defaultHeaders: {},
    timeoutMs: 1000,
    retry: { retries: 2, retryDelayMs: 1 },
    fetch: vi.fn(),
    ...overrides,
  } as ResolvedLilySdkConfig;
}

function jsonResponse(body: unknown, status = 200) {
  return () => new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function textResponse(body: string, status = 200) {
  return () => new Response(body, {
    status,
    headers: { 'content-type': 'text/plain' },
  });
}

function emptyResponse(status: number) {
  return () => new Response(null, { status });
}

describe('fetch-http-client coverage matrix', () => {
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    config = makeConfig();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buildUrl handles path without leading slash and query params', async () => {
    config.fetch = vi.fn().mockImplementation(jsonResponse({ ok: true }));
    const client = createFetchHttpClient(config);

    await client.request({ method: 'GET', path: 'health', query: { v: 1, empty: undefined } });

    const calledUrl = config.fetch.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe('/health');
    expect(calledUrl.searchParams.get('v')).toBe('1');
    expect(calledUrl.searchParams.has('empty')).toBe(false);
  });

  it('serializeBody returns undefined for null/undefined and stringifies objects', async () => {
    config.fetch = vi.fn().mockImplementation(jsonResponse({}));
    const client = createFetchHttpClient(config);

    await client.request({ method: 'POST', path: '/a', body: undefined });
    expect(config.fetch.mock.calls[0][1].body).toBeUndefined();

    await client.request({ method: 'POST', path: '/b', body: null });
    expect(config.fetch.mock.calls[1][1].body).toBeUndefined();

    await client.request({ method: 'POST', path: '/c', body: { x: 1 } });
    expect(config.fetch.mock.calls[2][1].body).toBe('{"x":1}');
  });

  it('parseResponse returns null for 204, text for non-json, json for application/json', async () => {
    const client = createFetchHttpClient(config);

    config.fetch = vi.fn().mockImplementation(emptyResponse(204));
    const r1 = await client.request({ method: 'GET', path: '/no-content' });
    expect(r1.data).toBeNull();

    config.fetch = vi.fn().mockImplementation(textResponse('plain text'));
    const r2 = await client.request({ method: 'GET', path: '/text' });
    expect(r2.data).toBe('plain text');

    config.fetch = vi.fn().mockImplementation(jsonResponse({ key: 'val' }));
    const r3 = await client.request({ method: 'GET', path: '/json' });
    expect(r3.data).toEqual({ key: 'val' });
  });

  it('retries on retryable status codes for safe methods and exhausts to LilyApiError', async () => {
    config.retry.retries = 2;
    config.fetch = vi.fn().mockImplementation(jsonResponse({ err: 'fail' }, 500));
    const client = createFetchHttpClient(config);

    const promise = client.request({ method: 'GET', path: '/fail' });
    
    // Advance timers for each retry delay
    await vi.advanceTimersByTimeAsync(1);
    await vi.advanceTimersByTimeAsync(2);
    
    // Ensure all pending promises settle before asserting
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toBeInstanceOf(LilyApiError);
    expect(config.fetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry POST on 500', async () => {
    config.fetch = vi.fn().mockImplementation(jsonResponse({}, 500));
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'POST', path: '/p' })).rejects.toBeInstanceOf(LilyApiError);
    expect(config.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws LilyAuthenticationError on 401/403 without retry', async () => {
    config.fetch = vi.fn()
      .mockImplementationOnce(jsonResponse({}, 401))
      .mockImplementationOnce(jsonResponse({}, 403));
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'GET', path: '/auth' })).rejects.toBeInstanceOf(LilyAuthenticationError);
    await expect(client.request({ method: 'GET', path: '/forbidden' })).rejects.toBeInstanceOf(LilyAuthenticationError);
    expect(config.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on transport errors for safe methods and exhausts to LilyTransportError', async () => {
    config.retry.retries = 1;
    config.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const client = createFetchHttpClient(config);

    const promise = client.request({ method: 'GET', path: '/net' });
    
    // Advance timer for retry delay
    await vi.advanceTimersByTimeAsync(1);
    
    // Settle remaining microtasks/promises
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toBeInstanceOf(LilyTransportError);
    expect(config.fetch).toHaveBeenCalledTimes(2);
  });

  it('wraps AbortError as TIMEOUT transport error', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    config.fetch = vi.fn().mockRejectedValue(abortErr);
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'GET', path: '/timeout' })).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });

  it('does not retry transport errors for POST', async () => {
    config.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'POST', path: '/post-net' })).rejects.toBeInstanceOf(LilyTransportError);
    expect(config.fetch).toHaveBeenCalledTimes(1);
  });
});
