import { describe, it, expect, vi } from 'vitest';
import { SystemClient } from '../src/clients/system-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient } from '../src/http/types';

function makeMockHttpClient(data: unknown): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data,
      attempts: 1,
      retried: false,
    }),
  };
}

describe('Runtime response validation', () => {
  it('returns data as-is when validateResponses is false (default)', async () => {
    const badData = { status: 123, unexpected: true };
    const client = new SystemClient(makeMockHttpClient(badData));
    const result = await client.health();
    expect(result).toEqual(badData);
  });

  it('validates and returns valid HealthStatus when validateResponses is true', async () => {
    const validData = { status: 'ok', version: '1.0.0', uptime: 3600 };
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 5000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: vi.fn(),
      validateResponses: true,
    };
    const mockHttp = makeMockHttpClient(validData);
    // Pass config so validateResponses=true is picked up
    const client = new SystemClient(config as any);
    // Override httpClient to use our mock
    (client as any).httpClient = mockHttp;

    const result = await client.health();
    expect(result.status).toBe('ok');
  });

  it('throws LilyValidationError for invalid HealthStatus when validateResponses is true', async () => {
    const invalidData = { status: 'unknown_value' };
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 5000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: vi.fn(),
      validateResponses: true,
    };
    const mockHttp = makeMockHttpClient(invalidData);
    const client = new SystemClient(config as any);
    (client as any).httpClient = mockHttp;

    await expect(client.health()).rejects.toThrow(LilyValidationError);
  });

  it('throws LilyValidationError for non-object HealthStatus when validateResponses is true', async () => {
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 5000,
      retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: vi.fn(),
      validateResponses: true,
    };
    const mockHttp = makeMockHttpClient(null);
    const client = new SystemClient(config as any);
    (client as any).httpClient = mockHttp;

    await expect(client.health()).rejects.toThrow(LilyValidationError);
  });
});
