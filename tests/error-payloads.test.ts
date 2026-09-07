import { describe, it, expect } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyApiError, LilyAuthenticationError } from '../src/errors/sdk-error';

function createMockFetch(status: number, body: unknown) {
  return async () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response);
}

describe('error payload propagation', () => {
  it('attaches statusCode, code, and details on 401 LilyAuthenticationError', async () => {
    const details = { message: 'Invalid token', traceId: 'abc-123' };
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      fetch: createMockFetch(401, details),
    });
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'GET', path: '/auth' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const error = err as LilyAuthenticationError;
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.details).toEqual(details);
    }
  });

  it('attaches statusCode, code, and details on 403 LilyAuthenticationError', async () => {
    const details = { message: 'Forbidden resource' };
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      fetch: createMockFetch(403, details),
    });
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'GET', path: '/forbidden' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const error = err as LilyAuthenticationError;
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.details).toEqual(details);
    }
  });

  it('attaches statusCode, code, and details on non-retryable 500 LilyApiError', async () => {
    const details = { error: 'Internal failure', requestId: 'req-999' };
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      retry: { retries: 0 },
      fetch: createMockFetch(500, details),
    });
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'POST', path: '/fail' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const error = err as LilyApiError;
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('API_ERROR');
      expect(error.details).toEqual(details);
    }
  });
});
