import { describe, it, expect, vi } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('Timeout abort (issue #8)', () => {
  it('aborts request when timeout elapses', async () => {
    const slowFetch = vi.fn(async (url: string, init?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener('abort', () => {
            reject(new Error('The operation was aborted'));
          });
        }
        // Never resolves on its own
      });
    });

    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.test.io',
      fetch: slowFetch as any,
      timeoutMs: 50,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    });
    const client = createFetchHttpClient(config);

    await expect(client.request({ method: 'GET', path: '/slow' })).rejects.toThrow();
  });

  it('timeout can be overridden per-request', async () => {
    const fastFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => '',
      headers: new Headers(),
    }));

    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.test.io',
      fetch: fastFetch as any,
      timeoutMs: 5000,
    });
    const client = createFetchHttpClient(config);

    const res = await client.request({ method: 'GET', path: '/fast', timeoutMs: 10000 });
    expect(res.status).toBe(200);
  });
});
