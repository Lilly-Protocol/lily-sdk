import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { VERSION } from '../src/version';

describe('resolveLilySdkConfig user-agent', () => {
  it('derives default user-agent from package version', () => {
    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com' });
    expect(config.userAgent).toBe(`lily-sdk/${VERSION}`);
  });

  it('allows overriding user-agent', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      userAgent: 'custom-agent/1.0',
    });
    expect(config.userAgent).toBe('custom-agent/1.0');
  });
});
