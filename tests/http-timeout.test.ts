import { afterEach, describe, expect, it, vi } from 'vitest';

import { LilyConfigError, LilyTransportError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

/**
 * A fetch that never settles on its own and only rejects when the caller's
 * AbortSignal fires — the same way a real fetch behaves against a server that
 * has accepted the connection and gone quiet. Anything that resolves on a timer
 * would be testing the timer, not the abort wiring.
 */
function hangingFetch(): ResolvedLilySdkConfig['fetch'] {
  return vi.fn(
    (_input: URL | RequestInfo, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          // Node's fetch rejects with a DOMException named AbortError.
          const error = new Error('The operation was aborted.');
          error.name = 'AbortError';
          reject(error);
        });
      }),
  );
}

function client(overrides: Partial<ResolvedLilySdkConfig> = {}) {
  return createFetchHttpClient({
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    fetch: hangingFetch(),
    toHeaders: () => ({}),
    ...overrides,
  });
}

describe('request timeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aborts a request that outlives the configured timeout', async () => {
    vi.useFakeTimers();

    const pending = client({ timeoutMs: 2_000 }).request({
      method: 'GET',
      path: '/v1/system/health',
    });
    const assertion =
      expect(pending).rejects.toBeInstanceOf(LilyTransportError);

    await vi.advanceTimersByTimeAsync(2_000);
    await assertion;
  });

  it('reports the timeout with the TIMEOUT code', async () => {
    vi.useFakeTimers();

    const pending = client({ timeoutMs: 1_000 }).request({
      method: 'GET',
      path: '/v1/system/health',
    });
    const assertion = expect(pending).rejects.toMatchObject({
      code: 'TIMEOUT',
      message: 'Request timed out while calling Lily Protocol API.',
    });

    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
  });

  it('does not abort before the timeout elapses', async () => {
    vi.useFakeTimers();

    let settled = false;
    const pending = client({ timeoutMs: 5_000 })
      .request({ method: 'GET', path: '/v1/system/health' })
      .catch(() => {
        settled = true;
      });

    await vi.advanceTimersByTimeAsync(4_999);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });

  it('lets a per-request timeout override the client default', async () => {
    vi.useFakeTimers();

    // Client default is 60s; the request asks for 500ms and must win.
    const pending = client({ timeoutMs: 60_000 }).request({
      method: 'GET',
      path: '/v1/system/health',
      timeoutMs: 500,
    });
    const assertion =
      expect(pending).rejects.toBeInstanceOf(LilyTransportError);

    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it('passes an AbortSignal to fetch so the socket is actually released', async () => {
    // A timeout that rejects the promise but leaves the request in flight is
    // a leak, not a timeout.
    const fetchSpy = hangingFetch();

    vi.useFakeTimers();

    const pending = client({ timeoutMs: 100, fetch: fetchSpy })
      .request({ method: 'GET', path: '/v1/system/health' })
      .catch(() => undefined);

    await vi.advanceTimersByTimeAsync(100);
    await pending;

    const init = vi.mocked(fetchSpy).mock.calls[0]?.[1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal?.aborted).toBe(true);
  });

  it('clears the timer when a request completes in time', async () => {
    // Otherwise a short-lived process is held open by a pending timer.
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

    await client({
      timeoutMs: 30_000,
      fetch: vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    }).request({ method: 'GET', path: '/v1/system/health' });

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('does not retry a timed-out request when retries are disabled', async () => {
    const fetchSpy = hangingFetch();

    vi.useFakeTimers();

    const pending = client({ timeoutMs: 100, fetch: fetchSpy })
      .request({ method: 'GET', path: '/v1/system/health' })
      .catch(() => undefined);

    await vi.advanceTimersByTimeAsync(100);
    await pending;

    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});

describe('per-request timeoutMs validation (Issue #446)', () => {
  it('rejects negative timeoutMs without calling fetch', async () => {
    const fetchSpy = vi.fn();
    const c = client({ fetch: fetchSpy });

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: -1 }),
    ).rejects.toBeInstanceOf(LilyConfigError);

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: -500 }),
    ).rejects.toThrow('`timeoutMs` must be a non-negative number.');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects NaN and non-finite timeoutMs without calling fetch', async () => {
    const fetchSpy = vi.fn();
    const c = client({ fetch: fetchSpy });

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: NaN }),
    ).rejects.toBeInstanceOf(LilyConfigError);

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: Infinity }),
    ).rejects.toBeInstanceOf(LilyConfigError);

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: -Infinity }),
    ).rejects.toBeInstanceOf(LilyConfigError);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects non-number timeoutMs without calling fetch', async () => {
    const fetchSpy = vi.fn();
    const c = client({ fetch: fetchSpy });

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: '5000' as any }),
    ).rejects.toBeInstanceOf(LilyConfigError);

    await expect(
      c.request({ method: 'GET', path: '/test', timeoutMs: null as any }),
    ).rejects.toBeInstanceOf(LilyConfigError);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allows timeoutMs: 0 and disables timeout', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const c = client({ fetch: fetchMock });

    const response = await c.request({
      method: 'GET',
      path: '/test',
      timeoutMs: 0,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('allows valid positive timeoutMs override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const c = client({ fetch: fetchMock });

    const response = await c.request({
      method: 'GET',
      path: '/test',
      timeoutMs: 1500,
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

