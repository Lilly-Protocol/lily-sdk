import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LilySdk } from '../../src/sdk';

interface RecordedRequest {
  method: string | undefined;
  path: string | undefined;
  authorization: string | undefined;
  apiKey: string | undefined;
  testHeader: string | undefined;
  body: unknown;
}

describe('fetch transport integration', () => {
  const requests: RecordedRequest[] = [];
  let server: Server;
  let sdk: LilySdk;

  beforeAll(async () => {
    server = createServer((request, response) => {
      void handleRequest(request, response, requests);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address() as AddressInfo;
    sdk = new LilySdk({
      baseUrl: `http://127.0.0.1:${String(address.port)}`,
      apiKey: 'integration-api-key',
      authToken: 'integration-auth-token',
      defaultHeaders: { 'x-test-suite': 'local-http' },
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('round-trips system health through the real fetch transport', async () => {
    const health = await sdk.system.health();

    expect(health).toEqual({
      status: 'ok',
      version: '0.1.0',
      timestamp: '2026-08-30T00:00:00.000Z',
      checks: { api: 'ok' },
    });
    expect(requests[0]).toEqual({
      method: 'GET',
      path: '/v1/system/health',
      authorization: 'Bearer integration-auth-token',
      apiKey: 'integration-api-key',
      testHeader: 'local-http',
      body: undefined,
    });
  });

  it('sends and parses wallet provisioning JSON over a real socket', async () => {
    const wallet = await sdk.wallets.provision({
      agentId: 'agent_integration',
      network: 'stellar-testnet',
    });

    expect(wallet.wallet).toMatchObject({
      id: 'wallet_integration',
      agentId: 'agent_integration',
      address: 'GINTEGRATIONADDRESS',
      network: 'stellar-testnet',
    });
    expect(requests[1]).toEqual({
      method: 'POST',
      path: '/v1/wallets/provision',
      authorization: 'Bearer integration-auth-token',
      apiKey: 'integration-api-key',
      testHeader: 'local-http',
      body: {
        agentId: 'agent_integration',
        network: 'stellar-testnet',
      },
    });
  });
});

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  requests: RecordedRequest[],
): Promise<void> {
  const body = await readJsonBody(request);

  requests.push({
    method: request.method,
    path: request.url,
    authorization: readHeader(request, 'authorization'),
    apiKey: readHeader(request, 'x-api-key'),
    testHeader: readHeader(request, 'x-test-suite'),
    body,
  });

  response.setHeader('content-type', 'application/json');

  if (request.method === 'GET' && request.url === '/v1/system/health') {
    response.end(
      JSON.stringify({
        status: 'ok',
        version: '0.1.0',
        timestamp: '2026-08-30T00:00:00.000Z',
        checks: { api: 'ok' },
      }),
    );
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/wallets/provision') {
    const input = body as { agentId: string; network: string };
    response.end(
      JSON.stringify({
        wallet: {
          id: 'wallet_integration',
          agentId: input.agentId,
          address: 'GINTEGRATIONADDRESS',
          network: input.network,
          status: 'active',
          balances: [],
          createdAt: '2026-08-30T00:00:00.000Z',
          updatedAt: '2026-08-30T00:00:00.000Z',
        },
      }),
    );
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ error: 'not found' }));
}

function readHeader(
  request: IncomingMessage,
  name: string,
): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value.join(', ') : value;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
