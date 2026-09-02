import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilyApiError, LilyAuthenticationError, LilyTransportError } from '../src/errors/sdk-error';

describe('transport error request metadata', () => {
  const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com' });
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    (config as any).fetch = fetchMock;
  });

  it('attaches request info to authentication errors', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'POST', path: '/payments', body: {} });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyAuthenticationError);
      const e = err as LilyAuthenticationError;
      expect(e.request).toEqual({
        method: 'POST',
        path: '/payments',
        url: 'https://api.example.com/payments',
      });
    }
  });

  it('attaches request info to api errors', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'bad request' }), { status: 400 }));
    const client = createFetchHttpClient(config);

    try {
      await client.request({ method: 'GET', path: '/agents', query: { limit: 10 } });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyApiError);
      const e = err as LilyApiError;
      expect(e.request).toEqual({
        method: 'GET',
        path: '/agents',
        url: 'https://api.example.com/agents?limit=10',
      });
    }
  });

  it('attaches request info to timeout errors', async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      return new Promise((_, reject) => {
        const timer = setTimeout(() => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        }, 100);
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const client = createFetchHttpClient({ ...config, timeoutMs: 20 });
    const promise = client.request({ method: 'DELETE', path: '/wallets/w1' });
    
    await expect(promise).rejects.toBeInstanceOf(LilyTransportError);
    
    try {
      await promise;
    } catch (err) {
      const e = err as LilyTransportError;
      expect(e.code).toBe('TIMEOUT');
      expect(e.request).toEqual({
        method: 'DELETE',
        path: '/wallets/w1',
        url: 'https://api.example.com/wallets/w1',
      });
    }
  });

  it('attaches request info to network errors', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createFetchHttpClient({ ...config, retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] } });

    try {
      await client.request({ method: 'PUT', path: '/identity/profile' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LilyTransportError);
      const e = err as LilyTransportError;
      expect(e.code).toBe('TRANSPORT_ERROR');
      expect(e.request).toEqual({
        method: 'PUT',
        path: '/identity/profile',
        url: 'https://api.example.com/identity/profile',
      });
    }
  });
});
