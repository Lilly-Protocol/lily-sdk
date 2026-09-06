import { describe, it, expect } from 'vitest';
import {
  LILY_ERROR_CODES,
  LilyTransportError,
  LilyValidationError,
} from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function makeTestConfig(
  overrides: Partial<ResolvedLilySdkConfig> = {},
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lilyprotocol.org'),
    timeoutMs: 5000,
    retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [500] },
    defaultHeaders: {},
    credentials: {},
    fetch: globalThis.fetch,
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

describe('Bounty #447: CANCELLED and RESPONSE_VALIDATION_ERROR error codes', () => {
  it('exposes CANCELLED and RESPONSE_VALIDATION_ERROR on LILY_ERROR_CODES', () => {
    expect(LILY_ERROR_CODES.CANCELLED).toBe('CANCELLED');
    expect(LILY_ERROR_CODES.RESPONSE_VALIDATION_ERROR).toBe(
      'RESPONSE_VALIDATION_ERROR',
    );
    expect(Object.isFrozen(LILY_ERROR_CODES)).toBe(true);
  });

  it('throws LilyTransportError with code LILY_ERROR_CODES.CANCELLED when signal is pre-aborted', async () => {
    const config = makeTestConfig();
    const client = createFetchHttpClient(config);
    const controller = new AbortController();
    controller.abort(new Error('User cancelled'));

    try {
      await client.request({
        method: 'GET',
        path: '/v1/test',
        signal: controller.signal,
      });
      expect.unreachable('Should have thrown LilyTransportError');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      const transportErr = err as LilyTransportError;
      expect(transportErr.code).toBe(LILY_ERROR_CODES.CANCELLED);
      expect(transportErr.message).toContain('cancelled');
    }
  });

  it('throws LilyValidationError with code LILY_ERROR_CODES.RESPONSE_VALIDATION_ERROR when JSON parse fails', async () => {
    const mockFetch = async () =>
      new Response('Not valid JSON {', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    const config = makeTestConfig({
      fetch: mockFetch as unknown as typeof fetch,
    });

    try {
      const client = createFetchHttpClient(config);
      await client.request({
        method: 'GET',
        path: '/v1/invalid-json',
      });
      expect.unreachable('Should have thrown LilyValidationError');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyValidationError);
      const valErr = err as LilyValidationError;
      expect(valErr.code).toBe(LILY_ERROR_CODES.RESPONSE_VALIDATION_ERROR);
    }
  });
});
