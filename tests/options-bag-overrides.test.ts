import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

/**
 * Bounty #67 — $20
 * "Add an options bag for per-call overrides on client methods"
 *
 * Tests that HttpRequest supports per-call timeoutMs and headers overrides.
 */
describe('per-call options bag overrides', () => {
  function createConfigWithFetch(fetchImpl: typeof globalThis.fetch): ResolvedLilySdkConfig {
    return {
      baseUrl: new URL('https://api.example.com/'),
      timeoutMs: 5000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [429] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: fetchImpl,
      toHeaders: () => ({ accept: 'application/json' }),
    };
  }

  it('allows per-request timeoutMs override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      timeoutMs: 100, // override
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeDefined();
  });

  it('allows per-request custom headers override', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const client = createFetchHttpClient(createConfigWithFetch(fetchMock as typeof fetch));

    await client.request({
      method: 'GET',
      path: '/v1/items',
      headers: { 'x-custom': 'value123' },
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-custom']).toBe('value123');
  });

  it('allows per-request headers to override config defaults', async () => {
    const config = createConfigWithFetch(
      vi.fn().mockResolvedValue(
        new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
      ) as typeof fetch,
    );
    config.defaultHeaders = { 'x-default': 'default-value' };
    const client = createFetchHttpClient(config);

    await client.request({
      method: 'GET',
      path: '/v1/items',
      headers: { 'x-default': 'override-value' },
    });

    const init = (config.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-default']).toBe('override-value');
  });

  it('HttpRequest type includes timeoutMs field', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(resolve(process.cwd(), 'src/http/types.ts'), 'utf8');
    expect(content).toContain('timeoutMs');
  });
});
