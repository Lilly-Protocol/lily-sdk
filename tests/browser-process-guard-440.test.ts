import { describe, it, expect } from 'vitest';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import { LilySdk } from '../src/sdk';

describe('resolveLilySdkConfig browser compatibility (issue #440)', () => {
  it('succeeds when process is undefined/deleted', () => {
    const originalProcess = globalThis.process;
    try {
      // @ts-expect-error simulating browser environment without process
      delete globalThis.process;

      const config = resolveLilySdkConfig({
        baseUrl: 'https://api.example.com',
      });

      expect(config.baseUrl.href).toBe('https://api.example.com/');
      expect(config.apiKey).toBeUndefined();
      expect(config.authToken).toBeUndefined();
    } finally {
      globalThis.process = originalProcess;
    }
  });

  it('constructs LilySdk in simulated browser environment without process', () => {
    const originalProcess = globalThis.process;
    try {
      // @ts-expect-error simulating browser environment without process
      delete globalThis.process;

      const sdk = new LilySdk({
        baseUrl: 'https://api.example.com',
      });

      expect(sdk.config.baseUrl.href).toBe('https://api.example.com/');
      expect(sdk.config.apiKey).toBeUndefined();
      expect(sdk.config.authToken).toBeUndefined();
    } finally {
      globalThis.process = originalProcess;
    }
  });

  it('resolves explicit credentials when process is undefined', () => {
    const originalProcess = globalThis.process;
    try {
      // @ts-expect-error simulating browser environment without process
      delete globalThis.process;

      const config = resolveLilySdkConfig({
        baseUrl: 'https://api.example.com',
        apiKey: 'test-api-key',
        authToken: 'test-auth-token',
      });

      expect(config.apiKey).toBe('test-api-key');
      expect(config.authToken).toBe('test-auth-token');
    } finally {
      globalThis.process = originalProcess;
    }
  });
});
