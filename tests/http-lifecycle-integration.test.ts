import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { RequestLifecycleHooks } from '../src/http/lifecycle-hooks';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyTransportError } from '../src/errors/sdk-error';

function makeConfig(
  mockFetch: ReturnType<typeof vi.fn>,
  overrides: Partial<{ retries: number; retryDelayMs: number }> = {},
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    timeoutMs: 5000,
    retry: {
      retries: overrides.retries ?? 0,
      retryDelayMs: overrides.retryDelayMs ?? 0,
      retryableStatusCodes: [429],
    },
    defaultHeaders: {},
    userAgent: 'test-agent',
    fetch: mockFetch as unknown as typeof globalThis.fetch,
    toHeaders: () => ({}),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createFetchHttpClient lifecycle hooks (issue #409)', () => {
  it('observes beforeRequest then afterResponse in order for a 200 response', async () => {
    const events: string[] = [];
    const hooks: RequestLifecycleHooks = {
      beforeRequest: vi.fn(async () => {
        events.push('beforeRequest');
      }),
      afterResponse: vi.fn(async () => {
        events.push('afterResponse');
      }),
    };
    const mockFetch = vi.fn(async () => jsonResponse(200, { ok: true }));
    const client = createFetchHttpClient(makeConfig(mockFetch), hooks);

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(200);
    expect(events).toEqual(['beforeRequest', 'afterResponse']);
    expect(hooks.beforeRequest).toHaveBeenCalledTimes(1);
    expect(hooks.afterResponse).toHaveBeenCalledTimes(1);
  });

  it('observes onRetry on a 429-then-success flow', async () => {
    const events: string[] = [];
    const hooks: RequestLifecycleHooks = {
      beforeRequest: async () => {
        events.push('beforeRequest');
      },
      afterResponse: async () => {
        events.push('afterResponse');
      },
      onRetry: vi.fn(async () => {
        events.push('onRetry');
      }),
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { error: 'slow down' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const client = createFetchHttpClient(
      makeConfig(mockFetch, { retries: 1, retryDelayMs: 1 }),
      hooks,
    );

    const result = await client.request({ method: 'GET', path: '/test' });

    expect(result.status).toBe(200);
    expect(result.attempts).toBe(2);
    expect(result.retried).toBe(true);
    expect(events).toEqual([
      'beforeRequest',
      'onRetry',
      'beforeRequest',
      'afterResponse',
    ]);
    expect(hooks.onRetry).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/test' }),
      1,
      1,
    );
  });

  it('observes onError on a terminal network failure', async () => {
    const onError = vi.fn(async () => {});
    const hooks: RequestLifecycleHooks = { onError };
    const failure = new Error('ECONNRESET');
    const mockFetch = vi.fn(async () => {
      throw failure;
    });
    const client = createFetchHttpClient(makeConfig(mockFetch), hooks);

    await expect(
      client.request({ method: 'POST', path: '/test' }),
    ).rejects.toThrow(LilyTransportError);

    expect(onError).toHaveBeenCalledTimes(1);
    const call = onError.mock.calls[0] as unknown as
      | [{ method: string; path: string }, LilyTransportError]
      | undefined;
    expect(call).toBeDefined();
    const [requestArg, errorArg] = call!;
    expect(requestArg).toMatchObject({ method: 'POST', path: '/test' });
    expect(errorArg).toBeInstanceOf(LilyTransportError);
  });

  it('observes onError on a terminal non-2xx API failure', async () => {
    const onError = vi.fn(async () => {});
    const hooks: RequestLifecycleHooks = { onError };
    const mockFetch = vi.fn(async () => jsonResponse(404, { error: 'nope' }));
    const client = createFetchHttpClient(makeConfig(mockFetch), hooks);

    await expect(
      client.request({ method: 'GET', path: '/missing' }),
    ).rejects.toThrow(/Lily Protocol API request failed/);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onError when a retried request eventually succeeds', async () => {
    const onError = vi.fn(async () => {});
    const hooks: RequestLifecycleHooks = { onError };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { error: 'slow down' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const client = createFetchHttpClient(
      makeConfig(mockFetch, { retries: 1, retryDelayMs: 1 }),
      hooks,
    );

    await client.request({ method: 'GET', path: '/test' });
    expect(onError).not.toHaveBeenCalled();
  });

  it('a throwing hook never rejects the underlying request', async () => {
    const hooks: RequestLifecycleHooks = {
      beforeRequest: async () => {
        throw new Error('hook blew up');
      },
      afterResponse: async () => {
        throw new Error('hook blew up');
      },
      onRetry: async () => {
        throw new Error('hook blew up');
      },
      onError: async () => {
        throw new Error('hook blew up');
      },
    };
    const mockFetch = vi.fn(async () => jsonResponse(200, { ok: true }));
    const client = createFetchHttpClient(makeConfig(mockFetch), hooks);

    await expect(
      client.request({ method: 'GET', path: '/test' }),
    ).resolves.toMatchObject({ status: 200 });
  });

  it('works without hooks (backward compatible)', async () => {
    const mockFetch = vi.fn(async () => jsonResponse(200, { ok: true }));
    const client = createFetchHttpClient(makeConfig(mockFetch));
    await expect(
      client.request({ method: 'GET', path: '/test' }),
    ).resolves.toMatchObject({ status: 200 });
  });
});
