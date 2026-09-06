import { describe, it, expect } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilyConfigError } from '../src/errors/sdk-error';

describe('request timeoutMs validation', () => {
  it('rejects negative timeoutMs with LilyConfigError', async () => {
    const mockFetch = async () => new Response();
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: -1,
      }),
    ).rejects.toThrow(LilyConfigError);
    
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: -1,
      }),
    ).rejects.toThrow('`timeoutMs` must be a non-negative number.');
  });

  it('rejects NaN timeoutMs with LilyConfigError', async () => {
    const mockFetch = async () => new Response();
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: NaN,
      }),
    ).rejects.toThrow(LilyConfigError);
  });

  it('rejects Infinity timeoutMs with LilyConfigError', async () => {
    const mockFetch = async () => new Response();
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: Infinity,
      }),
    ).rejects.toThrow(LilyConfigError);
  });

  it('rejects string timeoutMs with LilyConfigError', async () => {
    const mockFetch = async () => new Response();
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        // @ts-expect-error - testing runtime validation
        timeoutMs: '1000',
      }),
    ).rejects.toThrow(LilyConfigError);
  });

  it('accepts 0 timeoutMs (opt-out)', async () => {
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      return new Response(null, { status: 200 });
    };
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    // Should not throw
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: 0,
      }),
    ).resolves.toBeDefined();
    
    expect(fetchCalled).toBe(true);
  });

  it('accepts positive timeoutMs', async () => {
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      return new Response(null, { status: 200 });
    };
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    // Should not throw
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
        timeoutMs: 5000,
      }),
    ).resolves.toBeDefined();
    
    expect(fetchCalled).toBe(true);
  });

  it('uses config timeoutMs when request timeoutMs is undefined', async () => {
    let fetchCalled = false;
    const mockFetch = async () => {
      fetchCalled = true;
      return new Response(null, { status: 200 });
    };
    const config = {
      baseUrl: new URL('https://api.example.com'),
      timeoutMs: 10000,
      retry: { retries: 0, retryDelayMs: 100, retryableStatusCodes: [] },
      defaultHeaders: {},
      userAgent: 'test',
      fetch: mockFetch,
      toHeaders: () => ({}),
    };
    
    const client = createFetchHttpClient(config);
    
    // Should not throw
    await expect(
      client.request({
        method: 'GET',
        path: '/test',
      }),
    ).resolves.toBeDefined();
    
    expect(fetchCalled).toBe(true);
  });
});