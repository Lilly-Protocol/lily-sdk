import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import pkg from '../package.json';

// Vitest define replacement happens at build time; in test env we fallback
const EXPECTED_VERSION = typeof __LILY_SDK_VERSION__ !== 'undefined' 
  ? __LILY_SDK_VERSION__ 
  : pkg.version;

describe('default user agent', () => {
  it('includes the package version automatically', () => {
    const config = resolveLilySdkConfig({ baseUrl: 'https://api.example.com' });
    expect(config.userAgent).toBe(`lily-sdk/${EXPECTED_VERSION}`);
  });

  it('allows overriding the user agent', () => {
    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      userAgent: 'custom-agent/1.0',
    });
    expect(config.userAgent).toBe('custom-agent/1.0');
  });
});
