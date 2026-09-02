import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('resolveLilySdkConfig deep freeze', () => {
  it('freezes the entire resolved config object recursively', () => {
    const resolved = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      defaultHeaders: { 'x-custom': 'value' },
      retry: { retries: 3, retryDelayMs: 500, retryableStatusCodes: [429] },
    });

    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.retry)).toBe(true);
    expect(Object.isFrozen(resolved.defaultHeaders)).toBe(true);

    // Verify mutation is silently ignored or throws in strict mode
    expect(() => {
      'use strict';
      (resolved as unknown as { timeoutMs: number }).timeoutMs = 999;
    }).toThrow(TypeError);

    expect(() => {
      'use strict';
      (resolved.retry as unknown as { retries: number }).retries = 99;
    }).toThrow(TypeError);

    expect(() => {
      'use strict';
      (resolved.defaultHeaders as unknown as Record<string, string>)['x-new'] = 'hacked';
    }).toThrow(TypeError);

    // Verify values remain stable
    expect(resolved.timeoutMs).toBe(10_000);
    expect(resolved.retry.retries).toBe(3);
    expect(resolved.defaultHeaders['x-custom']).toBe('value');
    expect(resolved.defaultHeaders['x-new']).toBeUndefined();
  });
});
