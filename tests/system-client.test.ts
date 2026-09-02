import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemClient } from '../src/clients/system-client';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type { HealthStatus, ServiceInfo } from '../src/models';

function createMockHttpClient(responseData: unknown = {}): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: responseData,
    } as HttpResponse),
  };
}

const mockHealth: HealthStatus = {
  status: 'ok',
  version: '1.0.0',
  timestamp: '2024-01-01T00:00:00Z',
  checks: { database: 'ok', redis: 'ok' },
};

const mockInfo: ServiceInfo = {
  name: 'lily-api',
  version: '1.0.0',
  environment: 'production',
  docsUrl: 'https://docs.lily.dev',
};

describe('SystemClient', () => {
  let httpClient: HttpClient;
  let client: SystemClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    client = new SystemClient(httpClient);
  });

  describe('health', () => {
    it('sends GET /v1/system/health and returns the health status', async () => {
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockHealth,
      } as HttpResponse);

      const result = await client.health();

      expect(result).toEqual(mockHealth);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/system/health',
      });
    });
  });

  describe('info', () => {
    it('sends GET /v1/system/info and returns the service info', async () => {
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockInfo,
      } as HttpResponse);

      const result = await client.info();

      expect(result).toEqual(mockInfo);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/system/info',
      });
    });
  });
});
