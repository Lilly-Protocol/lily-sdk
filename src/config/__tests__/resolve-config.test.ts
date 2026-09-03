import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../resolve-config';

describe('resolveLilySdkConfig', () => {
  const baseConfig = { baseUrl: 'https://api.example.com' };

  it('returns a frozen resolved config object', () => {
    const resolved = resolveLilySdkConfig(baseConfig);
    expect(Object.isFrozen(resolved)).toBe(true);
  });

  it('freezes the retry policy deeply', () => {
    const resolved = resolveLilySdkConfig(baseConfig);
    expect(Object.isFrozen(resolved.retry)).toBe(true);
  });

  it('freezes defaultHeaders', () => {
    const resolved = resolveLilySdkConfig({
      ...baseConfig,
      defaultHeaders: { 'X-Custom': 'value' },
    });
    expect(Object.isFrozen(resolved.defaultHeaders)).toBe(true);
  });

  it('prevents mutation of resolved fields in strict mode', () => {
    'use strict';
    const resolved = resolveLilySdkConfig(baseConfig);
    expect(() => {
      (resolved as any).timeoutMs = 999;
    }).toThrow(TypeError);
  });
});
