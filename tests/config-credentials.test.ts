import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config.js';
import { LilyConfigError } from '../src/errors/sdk-error.js';

describe('resolveLilySdkConfig credential validation', () => {
  const base = { baseUrl: 'https://api.example.com' };

  it('accepts valid non-empty apiKey', () => {
    const config = resolveLilySdkConfig({ ...base, apiKey: 'sk-valid' });
    expect(config.apiKey).toBe('sk-valid');
  });

  it('accepts valid non-empty authToken', () => {
    const config = resolveLilySdkConfig({ ...base, authToken: 'tok-valid' });
    expect(config.authToken).toBe('tok-valid');
  });

  it('accepts absent credentials', () => {
    const config = resolveLilySdkConfig(base);
    expect(config.apiKey).toBeUndefined();
    expect(config.authToken).toBeUndefined();
  });

  it('rejects empty-string apiKey', () => {
    expect(() => resolveLilySdkConfig({ ...base, apiKey: '' })).toThrow(LilyConfigError);
  });

  it('rejects empty-string authToken', () => {
    expect(() => resolveLilySdkConfig({ ...base, authToken: '' })).toThrow(LilyConfigError);
  });

  it('rejects non-string apiKey', () => {
    expect(() => resolveLilySdkConfig({ ...base, apiKey: 123 as unknown as string })).toThrow(LilyConfigError);
  });

  it('rejects non-string authToken', () => {
    expect(() => resolveLilySdkConfig({ ...base, authToken: null as unknown as string })).toThrow(LilyConfigError);
  });
});
