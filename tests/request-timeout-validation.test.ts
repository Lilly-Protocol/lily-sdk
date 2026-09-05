import { describe, expect, it, vi, beforeEach } from 'vitest';

import { LilyValidationError, LILY_ERROR_CODES } from '../src/errors/sdk-error';
import {
  createFetchHttpClient,
  resolveRequestTimeout,
} from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

/** A fetch that never settles unless the signal fires — isolates timeout behaviour. */
function hangingFetch(): ResolvedLilySdkConfig['fetch'] {
  return vi.fn(
    (_input: URL | RequestInfo, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('The operation was aborted.');
          error.name = 'AbortError';
          reject(error);
        });
      }),
  );
}

function makeClient(overrides: Partial<ResolvedLilySdkConfig> = {}) {
  return createFetchHttpClient({
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 5_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    userAgent: 'test',
    validateResponses: true,
    fetch: hangingFetch(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig);
}

describe('resolveRequestTimeout', () => {
  it('returns config default when request override is undefined', () => {
    expect(resolveRequestTimeout(undefined, 5_000)).toBe(5_000);
  });

  it('returns 0 for explicit opt-out', () => {
    expect(resolveRequestTimeout(0, 5_000)).toBe(0);
  });

  it('returns valid positive override unchanged', () => {
    expect(resolveRequestTimeout(1_000, 5_000)).toBe(1_000);
  });

  it('throws for negative numbers', () => {
    expect(() => resolveRequestTimeout(-1, 5_000)).toThrow(LilyValidationError);
    expect(() => resolveRequestTimeout(-5000, 5_000)).toThrow(
      LilyValidationError,
    );
  });

  it('throws for NaN', () => {
    expect(() => resolveRequestTimeout(NaN, 5_000)).toThrow(
      LilyValidationError,
    );
  });

  it('throws for Infinity', () => {
    expect(() => resolveRequestTimeout(Infinity, 5_000)).toThrow(
      LilyValidationError,
    );
    expect(() => resolveRequestTimeout(-Infinity, 5_000)).toThrow(
      LilyValidationError,
    );
  });

  it('throws for string values', () => {
    expect(() =>
      resolveRequestTimeout('1000' as unknown as number, 5_000),
    ).toThrow(LilyValidationError);
  });

  it('throws for null', () => {
    expect(() =>
      resolveRequestTimeout(null as unknown as number, 5_000),
    ).toThrow(LilyValidationError);
  });

  it('throws for boolean true', () => {
    expect(() =>
      resolveRequestTimeout(true as unknown as number, 5_000),
    ).toThrow(LilyValidationError);
  });

  it('throws for object', () => {
    expect(() => resolveRequestTimeout({} as unknown as number, 5_000)).toThrow(
      LilyValidationError,
    );
  });
});

describe('fetch-http-client timeout validation', () => {
  it('rejects negative timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({ method: 'GET', path: '/test', timeoutMs: -5 }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('rejects NaN timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: NaN as unknown as number,
      }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('rejects Infinity timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({ method: 'GET', path: '/test', timeoutMs: Infinity }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('rejects string timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: '1000' as unknown as number,
      }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('rejects null timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: null as unknown as number,
      }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('rejects boolean timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: true as unknown as number,
      }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('rejects object timeoutMs before dispatching', async () => {
    const client = makeClient();
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: {} as unknown as number,
      }),
    ).rejects.toThrow(LilyValidationError);
  });

  it('validation error carries correct code and details', async () => {
    const client = makeClient();
    try {
      await client.request({ method: 'GET', path: '/test', timeoutMs: -1 });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LilyValidationError);
      expect((error as LilyValidationError).code).toBe(
        LILY_ERROR_CODES.VALIDATION_ERROR,
      );
      expect((error as LilyValidationError).details).toEqual({ timeoutMs: -1 });
    }
  });

  it('validation failure does not consume retry budget', async () => {
    const fetchSpy = vi.fn(hangingFetch());
    const client = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 3, retryDelayMs: 0, retryableStatusCodes: [] },
      userAgent: 'test',
      validateResponses: true,
      fetch: fetchSpy,
    } as unknown as ResolvedLilySdkConfig);
    try {
      await client.request({ method: 'GET', path: '/test', timeoutMs: -5 });
      expect.fail('Should have thrown');
    } catch {
      // expected
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allows valid positive override and dispatches', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ success: true }),
      text: async () => '{}',
    });
    const client = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      userAgent: 'test',
      validateResponses: true,
      fetch: fetchSpy,
    } as unknown as ResolvedLilySdkConfig);
    const result = await client.request({
      method: 'GET',
      path: '/test',
      timeoutMs: 1_000,
    });
    expect(result.data).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('allows absent override (uses config default) and dispatches', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ success: true }),
      text: async () => '{}',
    });
    const client = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      userAgent: 'test',
      validateResponses: true,
      fetch: fetchSpy,
    } as unknown as ResolvedLilySdkConfig);
    const result = await client.request({ method: 'GET', path: '/test' });
    expect(result.data).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('allows timeoutMs: 0 (opt-out) and dispatches without abort', async () => {
    let settled = false;
    const fetchSpy = vi.fn(
      (_input: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((resolve) => {
          setTimeout(() => {
            settled = true;
            resolve({
              ok: true,
              status: 200,
              headers: new Headers({ 'Content-Type': 'application/json' }),
              json: async () => ({ ok: true }),
              text: async () => '{}',
            });
          }, 50);
        }),
    );
    const client = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      userAgent: 'test',
      validateResponses: true,
      fetch: fetchSpy,
    } as unknown as ResolvedLilySdkConfig);
    const result = await client.request({
      method: 'GET',
      path: '/test',
      timeoutMs: 0,
    });
    expect(result.data).toEqual({ ok: true });
    expect(settled).toBe(true);
  });

  it('valid timeoutMs does not throw and uses the override value', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ ok: true }),
      text: async () => '{}',
    });
    const client = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      userAgent: 'test',
      validateResponses: true,
      fetch: fetchSpy,
    } as unknown as ResolvedLilySdkConfig);
    const result = await client.request({
      method: 'GET',
      path: '/test',
      timeoutMs: 2_000,
    });
    expect(result.data).toEqual({ ok: true });
    const callArgs = fetchSpy.mock.calls[0];
    const signal = callArgs[1]?.signal as AbortSignal | undefined;
    expect(signal).toBeDefined();
  });
});
