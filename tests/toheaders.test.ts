import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('toHeaders — auth serialization', () => {
  it('serializes apiKey to x-api-key header', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'my-secret-key',
    };
    const resolved = resolveLilySdkConfig(config);
    const headers = resolved.toHeaders();
    expect(headers['x-api-key']).toBe('my-secret-key');
  });

  it('serializes authToken to Authorization header', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      authToken: 'Bearer my-token',
    };
    const resolved = resolveLilySdkConfig(config);
    const headers = resolved.toHeaders();
    expect(headers['authorization']).toBe('Bearer my-token');
  });

  it('serializes both apiKey and authToken', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      authToken: 'Bearer t',
    };
    const resolved = resolveLilySdkConfig(config);
    const headers = resolved.toHeaders();
    expect(headers['x-api-key']).toBe('k');
    expect(headers['authorization']).toBe('Bearer t');
  });

  it('omits auth headers when neither is provided', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
    };
    const resolved = resolveLilySdkConfig(config);
    const headers = resolved.toHeaders();
    expect(headers).not.toHaveProperty('x-api-key');
    expect(headers).not.toHaveProperty('authorization');
  });

  it('includes defaultHeaders in the output', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      defaultHeaders: { 'x-custom': 'value' },
    };
    const resolved = resolveLilySdkConfig(config);
    const headers = resolved.toHeaders();
    expect(headers['x-custom']).toBe('value');
  });

  it('includes userAgent in the output', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
    };
    const resolved = resolveLilySdkConfig(config);
    const headers = resolved.toHeaders();
    expect(headers['user-agent']).toBe('lily-sdk/0.1.0');
  });

  it('returns a new object each call (not cached)', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
    };
    const resolved = resolveLilySdkConfig(config);
    const h1 = resolved.toHeaders();
    const h2 = resolved.toHeaders();
    expect(h1).not.toBe(h2);
    expect(h1).toEqual(h2);
  });
});
