import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('apiKey-only configuration', () => {
  it('resolves config with only apiKey', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'test-api-key',
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.apiKey).toBe('test-api-key');
    expect(resolved.authToken).toBeUndefined();
  });

  it('does not set authToken when only apiKey is provided', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved).not.toHaveProperty('authToken');
  });

  it('does not set apiKey when only authToken is provided', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      authToken: 'Bearer token',
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.authToken).toBe('Bearer token');
    expect(resolved).not.toHaveProperty('apiKey');
  });

  it('sets both when both are provided', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      authToken: 'Bearer t',
    };
    const resolved = resolveLilySdkConfig(config);
    expect(resolved.apiKey).toBe('k');
    expect(resolved.authToken).toBe('Bearer t');
  });

  it('rejects empty-string apiKey', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: '',
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects empty-string authToken', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      authToken: '',
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });

  it('rejects whitespace-only apiKey', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: '   ',
    };
    expect(() => resolveLilySdkConfig(config)).toThrow();
  });
});
