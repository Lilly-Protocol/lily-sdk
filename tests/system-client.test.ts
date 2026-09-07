import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemClient } from '../src/clients/system-client';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type { HealthStatus, ServiceInfo } from '../src/models';
import type { ResolvedLilySdkConfig } from '../src/config/types';
import { LilyValidationError } from '../src/errors/sdk-error';

function createMockConfig(
  options: {
    validateResponses?: boolean;
    fetch?: typeof globalThis.fetch;
  } = {},
): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.lily.dev'),
    timeoutMs: 5000,
    retry: {
      retries: 3,
      retryDelayMs: 500,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    },
    defaultHeaders: {},
    userAgent: 'lily-sdk-test',
    fetch: options.fetch ?? vi.fn(),
    validateResponses: options.validateResponses ?? false,
    toHeaders: () => ({}),
  };
}

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

  describe('response validation with ResolvedLilySdkConfig', () => {
    it('validates health response when validateResponses is true', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockHealth), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const config = createMockConfig({
        validateResponses: true,
        fetch: mockFetch,
      });

      const validatingClient = new SystemClient(config);
      const result = await validatingClient.health();

      expect(result).toEqual(mockHealth);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('throws LilyValidationError when response fails validation and validateResponses is true', async () => {
      const invalidPayload = { status: 'invalid_status', version: 123 };
      const mockFetch = vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(invalidPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );

      const config = createMockConfig({
        validateResponses: true,
        fetch: mockFetch,
      });

      const validatingClient = new SystemClient(config);
      await expect(validatingClient.health()).rejects.toThrow(
        LilyValidationError,
      );

      try {
        await validatingClient.health();
      } catch (err) {
        expect(err).toBeInstanceOf(LilyValidationError);
        expect((err as LilyValidationError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('does not validate response when validateResponses is false in config', async () => {
      const invalidPayload = {
        status: 'invalid_status_allowed',
        version: '1.0',
      };
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(invalidPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );

      const config = createMockConfig({
        validateResponses: false,
        fetch: mockFetch,
      });

      const nonValidatingClient = new SystemClient(config);
      const result = await nonValidatingClient.health();

      expect(result).toEqual(invalidPayload);
    });
  });
});
