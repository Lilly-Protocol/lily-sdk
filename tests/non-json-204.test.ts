import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { ResolvedLilySdkConfig } from '../src/config/types';

function createMockConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL('https://api.example.com'),
    apiKey: 'test-key',
    authToken: undefined,
    userAgent: 'lily-sdk/test',
    defaultHeaders: {},
    timeoutMs: 5000,
    retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
    fetch: vi.fn(),
    ...overrides,
  } as unknown as ResolvedLilySdkConfig;
}

describe('fetch-http-client non-JSON and 204 handling', () => {
  let config: ResolvedLilySdkConfig;

  beforeEach(() => {
    config = createMockConfig();
  });

  it('returns null data for 204 No Content responses', async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockRejectedValue(new Error('Should not call json() on 204')),
      text: vi.fn().mockResolvedValue(''),
    };
    vi.mocked(config.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'DELETE', path: '/v1/resource/1' });

    expect(result.status).toBe(204);
    expect(result.data).toBeNull();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('parses response as text when content-type is not JSON', async () => {
    const plainText = 'OK - Service Running';
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      json: vi.fn().mockRejectedValue(new Error('Should not call json() for text/plain')),
      text: vi.fn().mockResolvedValue(plainText),
    };
    vi.mocked(config.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'GET', path: '/health' });

    expect(result.status).toBe(200);
    expect(result.data).toBe(plainText);
    expect(mockResponse.text).toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('parses response as JSON when content-type includes application/json', async () => {
    const jsonData = { status: 'ok' };
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
      json: vi.fn().mockResolvedValue(jsonData),
      text: vi.fn(),
    };
    vi.mocked(config.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'GET', path: '/v1/status' });

    expect(result.data).toEqual(jsonData);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(mockResponse.text).not.toHaveBeenCalled();
  });

  it('falls back to text parsing when content-type header is missing', async () => {
    const rawBody = '<html>OK</html>';
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token <')),
      text: vi.fn().mockResolvedValue(rawBody),
    };
    vi.mocked(config.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const client = createFetchHttpClient(config);
    const result = await client.request({ method: 'GET', path: '/legacy' });

    expect(result.data).toBe(rawBody);
    expect(mockResponse.text).toHaveBeenCalled();
  });
});
