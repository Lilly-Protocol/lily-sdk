import { describe, expect, it, vi } from 'vitest';

import type { HealthStatus, ServiceInfo } from '../src/models';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('SystemClient', () => {
  // ─── health ───────────────────────────────────────────
  it('health sends GET /v1/system/health', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          status: 'ok',
          version: '0.1.0',
          timestamp: '2026-01-01T00:00:00Z',
          checks: {
            api: 'ok',
            database: 'ok',
            queue: 'ok',
          },
        } satisfies HealthStatus,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.system.health();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/system/health',
    });
    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.1.0');
    expect(result.checks.api).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(result.checks.queue).toBe('ok');
  });

  it('health return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      status: 'degraded',
      version: '2.0.0',
      timestamp: '2026-06-01T12:00:00Z',
      checks: {
        api: 'ok',
        database: 'degraded',
        queue: 'down',
      },
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.system.health();

    expect(result).toEqual(mockData);
  });

  // ─── info ─────────────────────────────────────────────
  it('info sends GET /v1/system/info', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          name: 'Lily Protocol API',
          version: '0.1.0',
          description: 'Agent finance infrastructure',
          network: 'stellar-testnet',
          documentation: 'https://docs.lily.test',
        } satisfies ServiceInfo,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.system.info();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/system/info',
    });
    expect(result.name).toBe('Lily Protocol API');
    expect(result.version).toBe('0.1.0');
    expect(result.network).toBe('stellar-testnet');
  });

  it('info return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      name: 'Lily Protocol API',
      version: '3.1.4',
      description: 'Updated description',
      network: 'stellar-mainnet',
      documentation: 'https://docs.lily.test/v3',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.system.info();

    expect(result).toEqual(mockData);
  });
});
