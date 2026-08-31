import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyTransportError } from '../src/errors/sdk-error';

describe('HttpRequest.signal support', () => {
  const baseConfig: ResolvedLilySdkConfig = {
    baseUrl: new URL('https://api.example.com/'),
    timeoutMs: 5000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: 'test-agent',
    fetch: vi.fn(),
  };

  it('cancels request when external signal is aborted before completion', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        }, 10);
      });
    });

    const config = {
      ...baseConfig,
      fetch: mockFetch as unknown as typeof fetch,
    };
    const client = createFetchHttpClient(config);

    const promise = client.request({
      method: 'GET',
      path: '/test',
      signal: controller.signal,
    });

    controller.abort();

    await expect(promise).rejects.toThrow(LilyTransportError);
    try {
      await promise;
    } catch (e) {
      expect((e as LilyTransportError).code).toBe('CANCELLED');
    }
  });

  it('throws CANCELLED immediately if signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const mockFetch = vi.fn();
    const config = {
      ...baseConfig,
      fetch: mockFetch as unknown as typeof fetch,
    };
    const client = createFetchHttpClient(config);

    const promise = client.request({
      method: 'GET',
      path: '/test',
      signal: controller.signal,
    });

    await expect(promise).rejects.toThrow(LilyTransportError);
    try {
      await promise;
    } catch (e) {
      expect((e as LilyTransportError).code).toBe('CANCELLED');
    }
  });

  it('distinguishes timeout abort from external cancel', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      return new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        }, 20);
      });
    });

    const config = {
      ...baseConfig,
      timeoutMs: 5,
      fetch: mockFetch as unknown as typeof fetch,
    };
    const client = createFetchHttpClient(config);

    const promise = client.request({
      method: 'GET',
      path: '/test',
    });

    await expect(promise).rejects.toThrow(LilyTransportError);
    try {
      await promise;
    } catch (e) {
      expect((e as LilyTransportError).code).toBe('TIMEOUT');
    }
  });
});
