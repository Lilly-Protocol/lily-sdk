import { describe, it, expect, beforeEach } from 'vitest';
import type { HttpClient, HttpRequest, HttpResponse } from '../src/http';
import { SystemClient } from '../src/clients/system-client';
import type { HealthStatus, ServiceInfo } from '../src/models';

describe('SystemClient', () => {
  let mockHttpClient: HttpClient;
  let client: SystemClient;
  let lastRequest: HttpRequest | undefined;

  beforeEach(() => {
    lastRequest = undefined;
    mockHttpClient = {
      request: ((req: HttpRequest): Promise<HttpResponse> => {
        lastRequest = req;
        if (req.path === '/v1/system/health') {
          const body: HealthStatus = {
            status: 'ok',
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00Z',
            checks: { db: 'ok' },
          };
          return Promise.resolve({
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            data: body,
          });
        }
        if (req.path === '/v1/system/info') {
          const body: ServiceInfo = {
            name: 'lily-api',
            version: '1.2.3',
            environment: 'production',
          };
          return Promise.resolve({
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            data: body,
          });
        }
        return Promise.reject(new Error(`Unexpected path: ${req.path}`));
      }) as unknown as HttpClient['request'],
    };
    client = new SystemClient(mockHttpClient);
  });

  it('info() sends GET /v1/system/info and returns ServiceInfo', async () => {
    const result = await client.info();
    expect(lastRequest).toBeDefined();
    if (!lastRequest) throw new Error('Expected request to be captured');
    expect(lastRequest.method).toBe('GET');
    expect(lastRequest.path).toBe('/v1/system/info');
    expect(result).toEqual({
      name: 'lily-api',
      version: '1.2.3',
      environment: 'production',
    });
  });

  it('health() sends GET /v1/system/health and returns HealthStatus with checks', async () => {
    const result = await client.health();
    expect(lastRequest).toBeDefined();
    if (!lastRequest) throw new Error('Expected request to be captured');
    expect(lastRequest.method).toBe('GET');
    expect(lastRequest.path).toBe('/v1/system/health');
    expect(result).toEqual({
      status: 'ok',
      version: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      checks: { db: 'ok' },
    });
  });
});
