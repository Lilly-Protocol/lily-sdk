import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config';
import { LilyTransportError } from '../src/errors/sdk-error';
import type { HttpRequest } from '../src/http';

describe('LilyTransportError cause propagation', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('propagates network error as cause on LilyTransportError', async () => {
    const networkError = new Error('ECONNREFUSED');
    globalThis.fetch = vi.fn(() => Promise.reject(networkError));

    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com', apiKey: 'test-key' });
    const client = createFetchHttpClient(config);
    const request: HttpRequest = { method: 'GET', path: '/v1/resource' };

    await expect(client.request(request)).rejects.toThrow(LilyTransportError);

    try {
      await client.request(request);
    } catch (error) {
      expect(error).toBeInstanceOf(LilyTransportError);
      const transportError = error as LilyTransportError;
      expect(transportError.cause).toBe(networkError);
      expect(transportError.code).toBe('TRANSPORT_ERROR');
    }
  });

  it('propagates timeout error as cause on LilyTransportError', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    globalThis.fetch = vi.fn(() => Promise.reject(abortError));

    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      timeoutMs: 50,
    });
    const client = createFetchHttpClient(config);
    const request: HttpRequest = { method: 'GET', path: '/v1/resource' };

    await expect(client.request(request)).rejects.toThrow(LilyTransportError);

    try {
      await client.request(request);
    } catch (error) {
      expect(error).toBeInstanceOf(LilyTransportError);
      const transportError = error as LilyTransportError;
      expect(transportError.cause).toBe(abortError);
      expect(transportError.code).toBe('TIMEOUT');
    }
  });
});
