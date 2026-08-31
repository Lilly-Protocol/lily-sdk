import { describe, it, expect } from 'vitest';
import * as SDK from '../src/index';

describe('export surface', () => {
  it('exports LilySdk class', () => {
    expect(SDK.LilySdk).toBeDefined();
    expect(typeof SDK.LilySdk).toBe('function');
  });

  it('exports resolveLilySdkConfig function', () => {
    expect(SDK.resolveLilySdkConfig).toBeDefined();
    expect(typeof SDK.resolveLilySdkConfig).toBe('function');
  });

  it('exports all error classes', () => {
    const errors = [
      'LilySdkError',
      'LilyConfigError',
      'LilyApiError',
      'LilyAuthenticationError',
      'LilyTransportError',
      'LilyValidationError',
    ] as const;

    for (const name of errors) {
      expect(SDK[name]).toBeDefined();
      expect(typeof SDK[name]).toBe('function');
    }
  });

  it('exports all client classes', () => {
    const clients = [
      'AgentClient',
      'IdentityClient',
      'PaymentClient',
      'SystemClient',
      'WalletClient',
    ] as const;

    for (const name of clients) {
      expect(SDK[name]).toBeDefined();
      expect(typeof SDK[name]).toBe('function');
    }
  });
});
