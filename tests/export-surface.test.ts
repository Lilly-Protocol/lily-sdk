import { describe, it, expect } from 'vitest';
import * as sdk from '../src/index';

describe('export surface', () => {
  it('exports all documented public symbols from src/index.ts', () => {
    // Core SDK
    expect(sdk.LilySdk).toBeDefined();
    expect(sdk.resolveLilySdkConfig).toBeDefined();

    // Clients
    expect(sdk.AgentClient).toBeDefined();
    expect(sdk.IdentityClient).toBeDefined();
    expect(sdk.PaymentClient).toBeDefined();
    expect(sdk.SystemClient).toBeDefined();
    expect(sdk.WalletClient).toBeDefined();

    // Error classes
    expect(sdk.LilySdkError).toBeDefined();
    expect(sdk.LilyConfigError).toBeDefined();
    expect(sdk.LilyApiError).toBeDefined();
    expect(sdk.LilyAuthenticationError).toBeDefined();
    expect(sdk.LilyTransportError).toBeDefined();
    expect(sdk.LilyValidationError).toBeDefined();
  });
});
