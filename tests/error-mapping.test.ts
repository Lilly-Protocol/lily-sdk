import { describe, expect, it, vi } from 'vitest';

import {
  LilyApiError,
  LilyAuthenticationError,
  LilyAuthorizationError,
  LilyConflictError,
  LilyNotFoundError,
  LilyRateLimitError,
  LilySdkError,
  LilyServerError,
  LilyValidationError,
} from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { BODY_SNIPPET_MAX_LENGTH, safeBodySnippet } from '../src/http/map-response-error';

function clientReturning(
  status: number,
  body: unknown,
  headers: Record<string, string> = { 'content-type': 'application/json' },
) {
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
    fetch: vi.fn(() =>
      Promise.resolve(
        new Response(typeof body === 'string' ? body : JSON.stringify(body), {
          status,
          headers,
        }),
      ),
    ),
  });
}

async function requestError(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): Promise<LilySdkError> {
  try {
    await clientReturning(status, body, headers).request({
      method: 'GET',
      path: '/v1/system/health',
    });
  } catch (error) {
    return error as LilySdkError;
  }

  throw new Error(`expected status ${String(status)} to reject`);
}

describe('status code to error class', () => {
  it.each([
    [400, LilyValidationError, 'VALIDATION_ERROR'],
    [401, LilyAuthenticationError, 'AUTHENTICATION_ERROR'],
    [403, LilyAuthorizationError, 'AUTHORIZATION_ERROR'],
    [404, LilyNotFoundError, 'NOT_FOUND'],
    [409, LilyConflictError, 'CONFLICT'],
    [422, LilyValidationError, 'VALIDATION_ERROR'],
    [429, LilyRateLimitError, 'RATE_LIMITED'],
    [500, LilyServerError, 'SERVER_ERROR'],
    [503, LilyServerError, 'SERVER_ERROR'],
    [418, LilyApiError, 'API_ERROR'],
  ])('maps %i to the matching typed error', async (status, expected, code) => {
    const error = await requestError(status, { message: 'nope' });

    expect(error).toBeInstanceOf(expected);
    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
  });

  it('keeps every mapped error a LilySdkError', async () => {
    for (const status of [400, 401, 403, 404, 409, 429, 500]) {
      expect(await requestError(status, {})).toBeInstanceOf(LilySdkError);
    }
  });

  it('keeps non-auth failures catchable as LilyApiError', async () => {
    // Callers that only care "the API rejected this" must not break.
    for (const status of [404, 409, 429, 500, 418]) {
      expect(await requestError(status, {})).toBeInstanceOf(LilyApiError);
    }
  });

  it('reports Retry-After on a rate limit', async () => {
    const error = (await requestError(429, { message: 'slow down' }, {
      'content-type': 'application/json',
      'retry-after': '30',
    })) as LilyRateLimitError;

    expect(error.retryAfterSeconds).toBe(30);
  });

  it('leaves Retry-After undefined when it is an HTTP date', async () => {
    // Only the delta-seconds form is reported; a date would mean guessing at
    // clock skew.
    const error = (await requestError(429, {}, {
      'content-type': 'application/json',
      'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT',
    })) as LilyRateLimitError;

    expect(error.retryAfterSeconds).toBeUndefined();
  });
});

describe('body snippet', () => {
  it('attaches a snippet of the response body', async () => {
    const error = await requestError(404, { message: 'agent not found' });

    expect(error.bodySnippet).toContain('agent not found');
  });

  it('redacts credentials echoed back in an error body', () => {
    const snippet = safeBodySnippet({
      message: 'invalid credentials',
      apiKey: 'sk-live-do-not-log-me',
      nested: { refresh_token: 'rt-do-not-log-me', Authorization: 'Bearer nope' },
    });

    expect(snippet).toContain('invalid credentials');
    expect(snippet).not.toContain('sk-live-do-not-log-me');
    expect(snippet).not.toContain('rt-do-not-log-me');
    expect(snippet).not.toContain('Bearer nope');
    expect(snippet).toContain('[redacted]');
  });

  it('redacts before truncating', () => {
    // Truncation is not redaction: a short token fits well inside the limit.
    const snippet = safeBodySnippet({ token: 'abc123' });

    expect(snippet).not.toContain('abc123');
  });

  it('truncates a long body', () => {
    const snippet = safeBodySnippet({ message: 'x'.repeat(1_000) });

    expect(snippet).toBeDefined();
    expect(snippet?.length).toBe(BODY_SNIPPET_MAX_LENGTH + 1); // + the ellipsis
    expect(snippet?.endsWith('…')).toBe(true);
  });

  it('handles a plain text body', async () => {
    const error = await requestError(500, 'upstream exploded', {
      'content-type': 'text/plain',
    });

    expect(error.bodySnippet).toBe('upstream exploded');
  });

  it('survives a circular body without throwing', () => {
    const body: Record<string, unknown> = { message: 'loop' };
    body.self = body;

    expect(safeBodySnippet(body)).toContain('circular');
  });

  it('is undefined for an empty body', () => {
    expect(safeBodySnippet(null)).toBeUndefined();
    expect(safeBodySnippet(undefined)).toBeUndefined();
    expect(safeBodySnippet('   ')).toBeUndefined();
  });

  it('keeps the full parsed body on details for callers that need it', async () => {
    const error = await requestError(400, { message: 'bad', field: 'amount' });

    expect(error.details).toEqual({ message: 'bad', field: 'amount' });
  });
});
