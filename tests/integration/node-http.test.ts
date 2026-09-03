import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import http from 'node:http';
import { createFetchHttpClient } from '../../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../../src/config/resolve-config';

describe('Transport against node:http (issue #104)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      server = http.createServer((req, res) => {
        if (req.url === '/v1/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }
        if (req.url?.startsWith('/v1/items/')) {
          const id = req.url.split('/').pop();
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id, name: `item-${id}` }));
            return;
          }
        }
        if (req.url === '/v1/echo' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(body || '{}');
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
      });
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr !== 'string') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('makes GET request and parses JSON response', async () => {
    const config = resolveLilySdkConfig({ baseUrl, fetch: globalThis.fetch });
    const client = createFetchHttpClient(config);
    const res = await client.request({ method: 'GET', path: '/v1/health' });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
  });

  it('makes POST request with body', async () => {
    const config = resolveLilySdkConfig({ baseUrl, fetch: globalThis.fetch });
    const client = createFetchHttpClient(config);
    const res = await client.request({
      method: 'POST',
      path: '/v1/echo',
      body: { message: 'hello' },
    });
    expect(res.status).toBe(201);
    expect(res.data).toEqual({ message: 'hello' });
  });

  it('handles 404 response', async () => {
    const config = resolveLilySdkConfig({
      baseUrl,
      fetch: globalThis.fetch,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    });
    const client = createFetchHttpClient(config);
    await expect(client.request({ method: 'GET', path: '/v1/unknown' })).rejects.toThrow();
  });
});
