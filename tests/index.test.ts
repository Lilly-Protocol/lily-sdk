import { describe, expect, it } from 'vitest';
import {
  AgentClient,
  IdentityClient,
  LilyApiError,
  LilyAuthenticationError,
  LilyConfigError,
  LilySdk,
  LilySdkError,
  LilyTransportError,
  LilyValidationError,
  PaymentClient,
  SystemClient,
  WalletClient,
  resolveLilySdkConfig,
} from '../src/index';

describe('public package entrypoint', () => {
  it.each([
    ['LilySdk', LilySdk],
    ['AgentClient', AgentClient],
    ['IdentityClient', IdentityClient],
    ['PaymentClient', PaymentClient],
    ['SystemClient', SystemClient],
    ['WalletClient', WalletClient],
    ['LilySdkError', LilySdkError],
    ['LilyConfigError', LilyConfigError],
    ['LilyApiError', LilyApiError],
    ['LilyAuthenticationError', LilyAuthenticationError],
    ['LilyTransportError', LilyTransportError],
    ['LilyValidationError', LilyValidationError],
    ['resolveLilySdkConfig', resolveLilySdkConfig],
  ])('exports %s', (_name, exportedSymbol) => {
    expect(exportedSymbol).toBeDefined();
  });
});
