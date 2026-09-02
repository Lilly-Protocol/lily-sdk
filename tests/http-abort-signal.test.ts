import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyTransportError } from '../src/errors/sdk-error';

describe('HttpRequest.signal support', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 5000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test-agent',
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cancels request when external signal is aborted', async () => {
    const controller = new AbortController();
    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const client = createFetchHttpClient(config);
    const promise = client.request({ method: 'GET', path: '/test', signal: controller.signal });

    setTimeout(() => controller.abort(), 10);

    await expect(promise).rejects.toThrow(LilyTransportError);
    try {
      await promise;
    } catch (error) {
      expect((error as LilyTransportError).code).toBe('CANCELLED');
    }
  });

  it('throws CANCELLED immediately if signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const client = createFetchHttpClient(config);
    const promise = client.request({ method: 'GET', path: '/test', signal: controller.signal });

    await expect(promise).rejects.toThrow(LilyTransportError);
    try {
      await promise;
    } catch (error) {
      expect((error as LilyTransportError).code).toBe('CANCELLED');
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('distinguishes timeout from external cancellation', async () => {
    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const client = createFetchHttpClient({ ...config, timeoutMs: 10 });
    const promise = client.request({ method: 'GET', path: '/test' });

    await expect(promise).rejects.toThrow(LilyTransportError);
    try {
      await promise;
    } catch (error) {
      expect((error as LilyTransportError).code).toBe('TIMEOUT');
    }
  });
});
