import { describe, it, expect, vi } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('LilySdk.withConfig routing (issue #405)', () => {
  function makeMockFetch() {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ items: [], nextCursor: null, hasNext: false }),
    });
  }

  it('routes tenant requests to tenant baseUrl with tenant apiKey', async () => {
    const mockFetch = makeMockFetch();
    const base = new LilySdk({
      baseUrl: 'https://api.base.com',
      apiKey: 'base-key',
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const tenant = base.withConfig({
      baseUrl: 'https://tenant.example.com',
      apiKey: 'tenant-key',
    });

    await tenant.agents.list();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0]!;
    expect(String(callArgs[0])).toContain('tenant.example.com');
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('tenant-key');
  });

  it('keeps original base instance routing intact', async () => {
    const mockFetch = makeMockFetch();
    const base = new LilySdk({
      baseUrl: 'https://api.base.com',
      apiKey: 'base-key',
      fetch: mockFetch as unknown as typeof globalThis.fetch,
    });

    const tenant = base.withConfig({
      baseUrl: 'https://tenant.example.com',
      apiKey: 'tenant-key',
    });

    await base.agents.list();
    await tenant.agents.list();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const calls = mockFetch.mock.calls!;
    expect(calls.length).toBe(2);
    expect(String(calls[0]![0])).toContain('api.base.com');
    expect(String(calls[1]![0])).toContain('tenant.example.com');
  });

  it('creates independent HttpClient when no fetch override is given', async () => {
    const base = new LilySdk({ baseUrl: 'https://api.base.com' });
    const tenant = base.withConfig({ baseUrl: 'https://tenant.example.com' });
    expect(tenant.http).not.toBe(base.http);
  });

  it('shares HttpClient when fetch is explicitly overridden', async () => {
    const mockFetch = vi.fn() as unknown as typeof globalThis.fetch;
    const customClient = { request: mockFetch } as any;
    const base = new LilySdk({ baseUrl: 'https://api.base.com' }, customClient);
    const tenant = base.withConfig({ fetch: mockFetch });
    expect(tenant.http).toBe(base.http);
  });
});
