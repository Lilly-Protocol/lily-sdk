import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';

describe('resolveLilySdkConfig immutability', () => {
  it('freezes the entire resolved config object recursively', () => {
    const resolved = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      defaultHeaders: { 'x-custom': 'value' },
      retry: { retries: 3, retryDelayMs: 500, retryableStatusCodes: [500] },
    });

    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.retry)).toBe(true);
    expect(Object.isFrozen(resolved.defaultHeaders)).toBe(true);

   // Mutations should fail silently or throw in strict mode
   expect(() => {
     'use strict';
      (resolved as unknown as Record<string, unknown>).timeoutMs = 999;
   }).toThrow();

   expect(() => {
     'use strict';
      (resolved.retry as unknown as Record<string, unknown>).retries = 99;
   }).toThrow();

   expect(() => {
     'use strict';
      (resolved.defaultHeaders as unknown as Record<string, unknown>)['x-new'] = 'hacked';
   }).toThrow();

    // Values remain unchanged
    expect(resolved.timeoutMs).toBe(10_000);
    expect(resolved.retry.retries).toBe(3);
    expect(resolved.defaultHeaders['x-custom']).toBe('value');
  });
});
