import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('unknown config keys warning', () => {
  let consoleWarnSpy: typeof console.warn;
  let warnings: string[];

  beforeEach(() => {
    warnings = [];
    consoleWarnSpy = console.warn;
    console.warn = (msg: string) => {
      warnings.push(String(msg));
    };
  });

  afterEach(() => {
    console.warn = consoleWarnSpy;
  });

  it('warns on unknown top-level keys', () => {
    const config: any = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      unknownKey: 'value',
    };
    resolveLilySdkConfig(config);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('unknownKey');
  });

  it('warns on multiple unknown keys', () => {
    const config: any = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      foo: 1,
      bar: 2,
    };
    resolveLilySdkConfig(config);
    expect(warnings.length).toBe(1); // single warning with all unknown keys listed
    expect(warnings[0]).toContain('foo');
    expect(warnings[0]).toContain('bar');
  });

  it('does not warn for known keys', () => {
    const config: any = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      authToken: 'Bearer t',
      timeoutMs: 5000,
      retry: { retries: 3 },
      defaultHeaders: { 'x-custom': 'val' },
      userAgent: 'custom/1.0',
      fetch: globalThis.fetch,
    };
    resolveLilySdkConfig(config);
    expect(warnings.length).toBe(0);
  });

  it('does not warn when no unknown keys are present', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
    };
    resolveLilySdkConfig(config);
    expect(warnings.length).toBe(0);
  });

  it('detects misspelled keys', () => {
    const config: any = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      timeouMs: 5000, // misspelled
    };
    resolveLilySdkConfig(config);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('timeouMs');
  });
});
