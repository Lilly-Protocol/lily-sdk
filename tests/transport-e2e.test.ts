import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { LilyAuthenticationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

describe('transport end-to-end against real node:http server', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === '/v1/json') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: req.url }));
        return;
      }

      if (req.url === '/v1/no-content') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/v1/unauthorized') {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ message: 'unauthorized' }));
        return;
      }

      if (req.url === '/v1/rate-limited') {
        res.writeHead(429, {
          'retry-after': '1',
          'content-type': 'text/plain',
        });
        res.end('rate limited');
        return;
      }

      if (req.url === '/v1/text') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('plain text response');
        return;
      }

      res.writeHead(404);
      res.end('');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => { resolve(); });
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  it('parses JSON responses from a real server', async () => {
    const client = createFetchHttpClient({
      baseUrl: new URL(baseUrl),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e',
      fetch: globalThis.fetch,
    });

    const response = await client.request({ method: 'GET', path: '/v1/json' });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true, path: '/v1/json' });
  });

  it('handles 204 no-content responses without throwing', async () => {
    const client = createFetchHttpClient({
      baseUrl: new URL(baseUrl),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e',
      fetch: globalThis.fetch,
    });

    const response = await client.request({
      method: 'GET',
      path: '/v1/no-content',
    });

    expect(response.status).toBe(204);
    expect(response.data).toBeNull();
  });

  it('maps 401 responses to LilyAuthenticationError over the wire', async () => {
    const client = createFetchHttpClient({
      baseUrl: new URL(baseUrl),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e',
      fetch: globalThis.fetch,
    });

    await expect(
      client.request({ method: 'GET', path: '/v1/unauthorized' }),
    ).rejects.toBeInstanceOf(LilyAuthenticationError);
  });

  it('returns text bodies when content-type is not JSON', async () => {
    const client = createFetchHttpClient({
      baseUrl: new URL(baseUrl),
      timeoutMs: 5_000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/e2e',
      fetch: globalThis.fetch,
    });

    const response = await client.request({ method: 'GET', path: '/v1/text' });

    expect(response.status).toBe(200);
    expect(response.data).toBe('plain text response');
  });
});
