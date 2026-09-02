import { describe, it, expect } from 'vitest';
import * as sdk from '../src/index';

describe('export surface', () => {
  it('exports LilySdk class', () => {
    expect(sdk.LilySdk).toBeDefined();
    expect(typeof sdk.LilySdk).toBe('function');
  });

  it('exports resolveLilySdkConfig function', () => {
    expect(sdk.resolveLilySdkConfig).toBeDefined();
    expect(typeof sdk.resolveLilySdkConfig).toBe('function');
  });

  it('exports all error classes', () => {
    expect(sdk.LilySdkError).toBeDefined();
    expect(sdk.LilyConfigError).toBeDefined();
    expect(sdk.LilyApiError).toBeDefined();
    expect(sdk.LilyAuthenticationError).toBeDefined();
    expect(sdk.LilyTransportError).toBeDefined();
    expect(sdk.LilyValidationError).toBeDefined();
  });

  it('exports all client classes', () => {
    expect(sdk.AgentClient).toBeDefined();
    expect(sdk.IdentityClient).toBeDefined();
    expect(sdk.PaymentClient).toBeDefined();
    expect(sdk.SystemClient).toBeDefined();
    expect(sdk.WalletClient).toBeDefined();
  });
});
