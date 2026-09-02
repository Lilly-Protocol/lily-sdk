import { createServer, type Server } from 'node:http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('Integration: local HTTP server', () => {
  let server: Server;
  let baseUrl: string;
  let lastRequest: {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
  } | null = null;

  beforeAll(async () => {
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString();
        let parsedBody: unknown = null;
        if (rawBody) {
          try {
            parsedBody = JSON.parse(rawBody);
          } catch {
            parsedBody = rawBody;
          }
        }

        lastRequest = {
          method: req.method ?? 'GET',
          url: req.url ?? '/',
          headers: req.headers,
          body: parsedBody,
        };

        if (req.url === '/v1/system/health') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
          return;
        }

        if (req.url === '/v1/wallets/provision' && req.method === 'POST') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ walletId: 'test-wallet-123' }));
          return;
        }

        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address();
    if (address && typeof address === 'object' && 'port' in address) {
      baseUrl = `http://127.0.0.1:${address.port}`;
    } else {
      throw new Error('Failed to get server port');
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('sdk.system.health() performs full round trip with correct path and headers', async () => {
    const sdk = new LilySdk({
      baseUrl,
      apiKey: 'integration-test-key',
      defaultHeaders: { 'x-custom': 'value' },
    });

    const result = await sdk.system.health();

    expect(result).toEqual({ status: 'ok' });
    expect(lastRequest).not.toBeNull();
    expect(lastRequest!.method).toBe('GET');
    expect(lastRequest!.url).toBe('/v1/system/health');
    expect(lastRequest!.headers['x-api-key']).toBe('integration-test-key');
    expect(lastRequest!.headers['x-custom']).toBe('value');
    expect(lastRequest!.headers['accept']).toBe('application/json');
  });

  it('sdk.wallets.provision() sends POST with JSON body and receives parsed response', async () => {
    const sdk = new LilySdk({
      baseUrl,
      authToken: 'bearer-token-xyz',
    });

    const result = await sdk.wallets.provision({ label: 'main' });

    expect(result).toEqual({ walletId: 'test-wallet-123' });
    expect(lastRequest).not.toBeNull();
    expect(lastRequest!.method).toBe('POST');
    expect(lastRequest!.url).toBe('/v1/wallets/provision');
    expect(lastRequest!.headers['authorization']).toBe('Bearer bearer-token-xyz');
    expect(lastRequest!.headers['content-type']).toBe('application/json');
    expect(lastRequest!.body).toEqual({ label: 'main' });
  });
});
