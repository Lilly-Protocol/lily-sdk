import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilyApiError, LilyAuthenticationError } from '../src/errors/sdk-error';

let server: http.Server;
let baseUrl: URL;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (url.pathname === '/v1/json') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', method: req.method }));
      return;
    }

    if (url.pathname === '/v1/no-content') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === '/v1/unauthorized') {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'invalid credentials' }));
      return;
    }

    if (url.pathname === '/v1/text') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('plain text response');
      return;
    }

    if (url.pathname === '/v1/rate-limited') {
      res.writeHead(429, {
        'content-type': 'application/json',
        'retry-after': '1',
      });
      res.end(JSON.stringify({ message: 'rate limited' }));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'not found' }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as AddressInfo;
  baseUrl = new URL(`http://127.0.0.1:${addr.port}/`);
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('end-to-end transport against real node:http server', () => {
  it('parses JSON response over a real socket', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl,
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e-test',
      fetch: globalThis.fetch,
    });

    const response = await httpClient.request<{
      status: string;
      method: string;
    }>({
      method: 'GET',
      path: '/v1/json',
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
    expect(response.data.method).toBe('GET');
  });

  it('handles 204 No Content without parsing body', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl,
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e-test',
      fetch: globalThis.fetch,
    });

    const response = await httpClient.request({
      method: 'POST',
      path: '/v1/no-content',
    });

    expect(response.status).toBe(204);
    expect(response.data).toBeNull();
  });

  it('throws LilyAuthenticationError on 401 over real network', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl,
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e-test',
      fetch: globalThis.fetch,
    });

    await expect(
      httpClient.request({ method: 'GET', path: '/v1/unauthorized' }),
    ).rejects.toBeInstanceOf(LilyAuthenticationError);
  });

  it('returns plain text response when content-type is not JSON', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl,
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e-test',
      fetch: globalThis.fetch,
    });

    const response = await httpClient.request<string>({
      method: 'GET',
      path: '/v1/text',
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('plain text response');
  });

  it('retries on 429 and succeeds when server recovers', async () => {
    let callCount = 0;
    const originalServer = server;

    // Create a separate server that fails once then succeeds
    const retryServer = http.createServer((_req, res) => {
      callCount++;
      if (callCount <= 1) {
        res.writeHead(429, {
          'content-type': 'application/json',
          'retry-after': '0',
        });
        res.end(JSON.stringify({ message: 'rate limited' }));
      } else {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ recovered: true, attempt: callCount }));
      }
    });

    await new Promise<void>((resolve) =>
      retryServer.listen(0, '127.0.0.1', () => resolve()),
    );
    const retryAddr = retryServer.address() as AddressInfo;
    const retryBaseUrl = new URL(`http://127.0.0.1:${retryAddr.port}/`);

    try {
      const httpClient = createFetchHttpClient({
        baseUrl: retryBaseUrl,
        timeoutMs: 5_000,
        retry: { retries: 2, retryDelayMs: 10, retryableStatusCodes: [429] },
        defaultHeaders: {},
        userAgent: 'lily-sdk/e2e-test',
        fetch: globalThis.fetch,
      });

      const response = await httpClient.request<{
        recovered: boolean;
        attempt: number;
      }>({
        method: 'GET',
        path: '/v1/data',
      });

      expect(response.status).toBe(200);
      expect(response.data.recovered).toBe(true);
      expect(callCount).toBe(2);
    } finally {
      await new Promise<void>((resolve) => retryServer.close(() => resolve()));
    }
  });
});
