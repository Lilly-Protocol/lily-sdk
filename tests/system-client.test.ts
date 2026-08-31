import { describe, expect, it } from 'vitest';
import type { HttpRequest } from '../src/http/types';
import type { HealthStatus, ServiceInfo } from '../src/models';
import { SystemClient } from '../src/clients/system-client';
import { createMockHttpClient } from './helpers/mock-http-client';

const stubHealth: HealthStatus = {
  status: 'ok',
  version: '1.0.0',
  timestamp: '2024-01-01T00:00:00Z',
  checks: { db: 'ok', redis: 'ok' },
};

const stubInfo: ServiceInfo = {
  name: 'lily-api',
  version: '1.0.0',
  environment: 'production',
  docsUrl: 'https://docs.lily.dev',
};

describe('SystemClient', () => {
  it('info sends GET /v1/system/info and returns service info', async () => {
    let captured: HttpRequest<undefined> | undefined;
    const client = new SystemClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<undefined>;
        return { status: 200, data: stubInfo };
      }),
    );

    const result = await client.info();

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('GET');
    expect(captured!.path).toBe('/v1/system/info');
    expect(result).toEqual(stubInfo);
  });

  it('health sends GET /v1/system/health and returns health status', async () => {
    let captured: HttpRequest<undefined> | undefined;
    const client = new SystemClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<undefined>;
        return { status: 200, data: stubHealth };
      }),
    );

    const result = await client.health();

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('GET');
    expect(captured!.path).toBe('/v1/system/health');
    expect(result).toEqual(stubHealth);
  });
});
