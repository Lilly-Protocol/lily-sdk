import { describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('SystemClient', () => {
  it('calls GET /v1/system/info and returns ServiceInfo data', async () => {
    const infoData = {
      name: 'lily-api',
      version: '0.1.0',
      environment: 'test',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: infoData,
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(requestSpy),
    );

    const info = await sdk.system.info();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/system/info',
    });
    expect(info).toEqual(infoData);
  });

  it('maps health response to HealthStatus with checks', async () => {
    const healthData = {
      status: 'ok',
      version: '0.1.0',
      timestamp: '2026-08-31T00:00:00.000Z',
      checks: {
        api: 'ok',
        db: 'ok',
      },
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: healthData,
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(requestSpy),
    );

    const health = await sdk.system.health();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/system/health',
    });
    expect(health).toEqual(healthData);
    expect(health.checks).toEqual({ api: 'ok', db: 'ok' });
  });
});
