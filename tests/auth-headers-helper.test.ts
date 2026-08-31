import { describe, it, expect } from 'vitest';
import { resolveAuthHeaders } from '../src/http/auth-headers';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('resolveAuthHeaders', () => {
  it('returns only x-api-key when only apiKey is configured', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
    });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({ 'x-api-key': 'test-key' });
  });

  it('returns only authorization when only authToken is configured', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      authToken: 'test-token',
    });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({ authorization: 'Bearer test-token' });
  });

  it('returns both headers when apiKey and authToken are configured', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      authToken: 'test-token',
    });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({
      'x-api-key': 'test-key',
      authorization: 'Bearer test-token',
    });
  });

  it('returns empty object when no credentials are configured', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
    });
    const headers = resolveAuthHeaders(config);
    expect(headers).toEqual({});
  });
});
