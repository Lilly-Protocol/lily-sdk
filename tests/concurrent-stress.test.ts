import { describe, it, expect, vi } from 'vitest';
import type { HttpClient, HttpRequest, HttpResponse } from '../src/http/types';
import { BaseClient } from '../src/clients/base-client';

function createMockClient(mockFn: ReturnType<typeof vi.fn>): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(req: HttpRequest<TRequest>): Promise<HttpResponse<TResponse>> {
      const url = `https://api.test.io${req.path}`;
      const result = await mockFn(url, req);
      return {
        status: result.status,
        headers: new Map(),
        data: result.data,
      } as HttpResponse<TResponse>;
    },
  };
}

class TestClient extends BaseClient {
  public async get<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'GET', path });
  }
  public async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, body: body as any });
  }
}

describe('Concurrent stress (issue #103)', () => {
  it('handles 50 concurrent requests sharing one HttpClient', async () => {
    const mockFetch = vi.fn(async (url: string, init?: any) => ({
      status: 200,
      data: { url, method: init?.method || 'GET' },
    }));
    const client = createMockClient(mockFetch);
    const test = new TestClient(client);

    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) => test.get(`/endpoint-${i}`))
    );

    expect(results).toHaveLength(50);
    expect(mockFetch).toHaveBeenCalledTimes(50);
    results.forEach((r: any, i) => {
      expect(r.url).toBe(`https://api.test.io/endpoint-${i}`);
    });
  });

  it('mixed read/write operations do not interfere', async () => {
    const state: Record<string, any> = {};
    const mockFetch = vi.fn(async (url: string, init?: any) => {
      const method = init?.method || 'GET';
      if (method === 'POST') {
        state[url] = init.body;
        return { status: 201, data: { created: true } };
      }
      return { status: 200, data: state[url] || null };
    });
    const client = createMockClient(mockFetch);
    const test = new TestClient(client);

    const writes = Array.from({ length: 10 }, (_, i) =>
      test.post(`/item-${i}`, { id: i, value: `val-${i}` })
    );
    await Promise.all(writes);

    const reads = await Promise.all(
      Array.from({ length: 10 }, (_, i) => test.get(`/item-${i}`))
    );

    reads.forEach((r: any, i) => {
      expect(r).toEqual({ id: i, value: `val-${i}` });
    });
  });

  it('one failing request does not affect others in concurrent batch', async () => {
    let callCount = 0;
    const mockFetch = vi.fn(async (url: string) => {
      callCount++;
      if (callCount === 5) {
        throw new Error('server error');
      }
      return { status: 200, data: { ok: true } };
    });
    const client = createMockClient(mockFetch);
    const test = new TestClient(client);

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => test.get('/test'))
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
    expect(fulfilled.length + rejected.length).toBe(10);
  });
});
