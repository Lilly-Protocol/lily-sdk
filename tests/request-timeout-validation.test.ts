import { describe, expect, it, vi } from 'vitest';

import { LILY_ERROR_CODES, LilyValidationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

/**
 * A fetch that records every call and resolves immediately. The point of these
 * tests is what does NOT reach it: an invalid per-request `timeoutMs` must be
 * refused before a request is dispatched, so `fetch` staying uncalled is the
 * assertion, not an incidental detail.
 */
function recordingFetch(): ResolvedLilySdkConfig['fetch'] {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

/**
 * A fetch that never settles on its own and only rejects when the caller's
 * AbortSignal fires. Used for the `timeoutMs: 0` case, where the absence of a
 * timer is what is being asserted: if a timeout were installed, this promise
 * would be aborted and the test would fail instead of timing out cleanly.
 */
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

function client(overrides: Partial<ResolvedLilySdkConfig> = {}) {
  const fetchImpl = overrides.fetch ?? recordingFetch();
  const config = {
    baseUrl: new URL('https://api.lily.test/'),
    timeoutMs: 2_000,
    retry: {
      retries: 0,
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk/test',
    validateResponses: true,
    ...overrides,
    fetch: fetchImpl,
  } as unknown as ResolvedLilySdkConfig;

  return { http: createFetchHttpClient(config), fetchImpl };
}

describe('per-request timeoutMs validation', () => {
  // Every value here reached `setTimeout` unvalidated before this change.
  // Negative and NaN produced a timer that fires at once; Infinity produced
  // one that never fires. Both surfaced to the caller as a TIMEOUT transport
  // error, which blames the network for the caller's argument.
  const invalid: ReadonlyArray<[string, unknown]> = [
    ['a negative number', -1],
    ['a large negative number', -5_000],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['a numeric string', '1000'],
    ['null', null],
    ['a boolean', true],
    ['an object', {}],
  ];

  for (const [label, value] of invalid) {
    it(`rejects ${label} without dispatching a request`, async () => {
      const { http, fetchImpl } = client();

      await expect(
        http.request({
          method: 'GET',
          path: '/agents',
          timeoutMs: value as number,
        }),
      ).rejects.toBeInstanceOf(LilyValidationError);

      expect(fetchImpl).not.toHaveBeenCalled();
    });
  }

  it('reports the validation error code, the offending value and the request', async () => {
    const { http } = client();

    const error = await http
      .request({ method: 'GET', path: '/agents', timeoutMs: -1 })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LilyValidationError);
    const validationError = error as LilyValidationError;
    expect(validationError.code).toBe(LILY_ERROR_CODES.VALIDATION_ERROR);
    expect(validationError.message).toContain('`timeoutMs`');
    expect(validationError.details).toEqual({ timeoutMs: -1 });
    expect(validationError.request).toMatchObject({
      method: 'GET',
      path: '/agents',
    });
  });

  it('does not retry an invalid timeout on a retryable method', async () => {
    // A validation failure is the caller's, not the network's, so it must not
    // consume the retry budget: one refusal, zero dispatches.
    const { http, fetchImpl } = client({
      retry: { retries: 3, retryDelayMs: 0, retryableStatusCodes: [500] },
    } as Partial<ResolvedLilySdkConfig>);

    await expect(
      http.request({ method: 'GET', path: '/agents', timeoutMs: Number.NaN }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts a positive per-request override', async () => {
    const { http, fetchImpl } = client();

    const response = await http.request({
      method: 'GET',
      path: '/agents',
      timeoutMs: 1_000,
    });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls back to the configured timeout when no override is given', async () => {
    const { http, fetchImpl } = client();

    const response = await http.request({ method: 'GET', path: '/agents' });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('keeps `timeoutMs: 0` as the documented opt-out', async () => {
    // With no timer installed the hanging fetch is never aborted, so the only
    // thing that ends this test is the explicit abort below. If a timeout were
    // still armed, the request would reject with a TIMEOUT error first.
    const controller = new AbortController();
    const { http } = client({ fetch: hangingFetch() });

    const pending = http.request({
      method: 'GET',
      path: '/agents',
      timeoutMs: 0,
      signal: controller.signal,
    });

    const settled = await Promise.race([
      pending.then(
        () => 'resolved',
        (error: unknown) =>
          error instanceof Error ? `rejected:${error.message}` : 'rejected',
      ),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('still pending'), 50);
      }),
    ]);

    expect(settled).toBe('still pending');

    controller.abort();
    await expect(pending).rejects.toThrow();
  });
});
