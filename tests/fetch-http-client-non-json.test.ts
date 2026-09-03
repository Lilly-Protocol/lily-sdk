import { describe, expect, it, vi } from 'vitest';

import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyApiError, LilyValidationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

function createConfig(
  overrides: Record<string, unknown> = {},
): ResolvedLilySdkConfig {
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
    fetch: vi.fn<typeof globalThis.fetch>(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain' },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetch-http-client — non-JSON and 204 handling', () => {
  it('returns null for 204 No Content responses', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(emptyResponse(204)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(204);
    expect(response.data).toBeNull();
  });

  it('returns text body for non-JSON content-type', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(textResponse('plain text', 200)),
    );
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('plain text');
  });

  it('returns text body for HTML content-type', async () => {
    const htmlResponse = new Response('<html><body>Hello</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    const fetchSpy = vi.fn(() => Promise.resolve(htmlResponse));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('<html><body>Hello</body></html>');
  });

  it('returns text body when content-type is missing', async () => {
    const noTypeResponse = new Response('no type', {
      status: 200,
      headers: {},
    });
    const fetchSpy = vi.fn(() => Promise.resolve(noTypeResponse));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(typeof response.data).toBe('string');
  });
});

describe('fetch-http-client — failed responses with unparseable JSON bodies (issue #445)', () => {
  function jsonErrorResponse(status: number, body: string | null): Response {
    return new Response(body, {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }

  it('reports the real HTTP status when a 500 body is empty', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonErrorResponse(500, null)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    await expect(
      client.request({ method: 'GET', path: '/v1/agents' }),
    ).rejects.toThrow(LilyApiError);

    const error = await client
      .request({ method: 'GET', path: '/v1/agents' })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(LilyApiError);
    expect(error).not.toBeInstanceOf(LilyValidationError);
    expect((error as LilyApiError).statusCode).toBe(500);
    expect((error as LilyApiError).details).toEqual({
      contentType: 'application/json',
      body: '',
    });
  });

  it('surfaces the raw body text of a malformed 500 response', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(jsonErrorResponse(500, 'oops, not json')),
    );
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const error = await client
      .request({ method: 'GET', path: '/v1/agents' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LilyApiError);
    expect(error).not.toBeInstanceOf(LilyValidationError);
    expect((error as LilyApiError).statusCode).toBe(500);
    expect((error as LilyApiError).details).toEqual({
      contentType: 'application/json',
      body: 'oops, not json',
    });
  });

  it('still parses valid JSON bodies on failed responses', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        jsonErrorResponse(500, JSON.stringify({ error: 'boom' })),
      ),
    );
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const error = await client
      .request({ method: 'GET', path: '/v1/agents' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LilyApiError);
    expect((error as LilyApiError).statusCode).toBe(500);
    expect((error as LilyApiError).details).toEqual({ error: 'boom' });
  });

  it('keeps the strict validation error for empty 2xx JSON bodies', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonErrorResponse(200, null)));
    const client = createFetchHttpClient(createConfig({ fetch: fetchSpy }));

    const error = await client
      .request({ method: 'GET', path: '/v1/agents' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LilyValidationError);
    expect((error as LilyValidationError).code).toBe(
      'RESPONSE_VALIDATION_ERROR',
    );
  });
});
