import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { SDK_VERSION } from '../src/version';
import pkg from '../package.json';

describe('default user-agent version', () => {
  it('matches package.json version', () => {
    expect(SDK_VERSION).toBe(pkg.version);
  });

  it('is used when no userAgent is provided', () => {
    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com' });
    expect(config.userAgent).toBe(`lily-sdk/${pkg.version}`);
  });

  it('can be overridden explicitly', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      userAgent: 'custom-agent/1.0',
    });
    expect(config.userAgent).toBe('custom-agent/1.0');
  });
});
