import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyTransportError } from '../src/errors/sdk-error';

describe('fetch-http-client abort signal', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    mockFetch = vi.fn();
    config = {
      baseUrl: new URL('https://api.example.com'),
      fetch: mockFetch,
      timeoutMs: 5000,
      userAgent: 'test-agent',
      defaultHeaders: {},
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    } as unknown as ResolvedLilySdkConfig;
  });

  it('throws CANCELLED when external signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('user cancelled'));

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'GET', path: '/test', signal: controller.signal }),
    ).rejects.toThrow(LilyTransportError);

    try {
      await client.request({ method: 'GET', path: '/test', signal: controller.signal });
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      expect((err as LilyTransportError).code).toBe('CANCELLED');
    }

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('aborts in-flight request when external signal fires', async () => {
    const controller = new AbortController();

    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new DOMException('The operation was aborted.', 'AbortError');
          reject(err);
        });
      });
    });

    const client = createFetchHttpClient(config);
    const promise = client.request({ method: 'GET', path: '/test', signal: controller.signal });

    // Allow microtasks to set up listeners
    await new Promise((r) => setTimeout(r, 10));
    controller.abort(new Error('external cancel'));

    await expect(promise).rejects.toThrow(LilyTransportError);

    try {
      await client.request({ method: 'GET', path: '/test', signal: controller.signal });
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      expect((err as LilyTransportError).code).toBe('CANCELLED');
    }
  });

  it('distinguishes timeout from external cancellation', async () => {
    config.timeoutMs = 20;

    mockFetch.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new DOMException('The operation was aborted.', 'AbortError');
          reject(err);
        });
      });
    });

    const client = createFetchHttpClient(config);

    await expect(
      client.request({ method: 'GET', path: '/test' }),
    ).rejects.toThrow(LilyTransportError);

    try {
      await client.request({ method: 'GET', path: '/test' });
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      expect((err as LilyTransportError).code).toBe('TIMEOUT');
    }
  });

  it('cleans up listener on success', async () => {
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, 'removeEventListener');

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ ok: true }),
      text: async () => '',
    });

    const client = createFetchHttpClient(config);
    await client.request({ method: 'GET', path: '/test', signal: controller.signal });

    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});
