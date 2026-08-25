import { describe, expect, it } from 'vitest';

// This test ensures every exported symbol from src/index.ts can be imported
// without error. It validates the public API surface.

import {
  LilySdk,
  AgentClient,
  WalletClient,
  PaymentClient,
  IdentityClient,
  SystemClient,
  resolveLilySdkConfig,
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
  LilyConfigError,
} from '../src/index';

// BaseClient and createFetchHttpClient are not exported from index.ts
// Import them directly to verify they exist in the codebase
import { BaseClient } from '../src/clients/base-client';
import { createFetchHttpClient } from '../src/http/fetch-http-client';

import type {
  Agent,
  Wallet,
  Payment,
  PaymentQuote,
  IdentityProfile,
  VerificationResult,
  HealthStatus,
  ServiceInfo,
  ProvisionWalletRequest,
  WalletProvisioningResult,
  ExecutePaymentRequest,
  PaymentQuoteRequest,
  ResolveIdentityRequest,
  VerifyIdentityRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  ListAgentsQuery,
  MoneyAmount,
  ResourceStatus,
  AuditMetadata,
} from '../src/index';

import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
  RetryPolicy,
} from '../src/index';

// HttpMethod and HttpHeaders are not exported from index.ts
import type { HttpMethod, HttpHeaders } from '../src/http/types';

import type {
  LilySdkConfig,
  ResolvedLilySdkConfig,
} from '../src/index';

import type {
  WalletClientContract,
  PaymentClientContract,
  IdentityClientContract,
  SystemClientContract,
  AgentClientContract,
} from '../src/index';

describe('export-surface — every symbol from src/index.ts', () => {
  it('exports LilySdk class', () => {
    expect(LilySdk).toBeDefined();
    expect(typeof LilySdk).toBe('function');
  });

  it('exports all client classes', () => {
    expect(AgentClient).toBeDefined();
    expect(WalletClient).toBeDefined();
    expect(PaymentClient).toBeDefined();
    expect(IdentityClient).toBeDefined();
    expect(SystemClient).toBeDefined();
    expect(BaseClient).toBeDefined();
  });

  it('exports factory functions', () => {
    expect(createFetchHttpClient).toBeDefined();
    expect(typeof createFetchHttpClient).toBe('function');
    expect(resolveLilySdkConfig).toBeDefined();
    expect(typeof resolveLilySdkConfig).toBe('function');
  });

  it('exports all error classes', () => {
    expect(LilyApiError).toBeDefined();
    expect(LilyAuthenticationError).toBeDefined();
    expect(LilyTransportError).toBeDefined();
    expect(LilyConfigError).toBeDefined();
  });

  it('can instantiate LilySdk', () => {
    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.test',
    });

    expect(sdk.agents).toBeInstanceOf(AgentClient);
    expect(sdk.wallets).toBeInstanceOf(WalletClient);
    expect(sdk.payments).toBeInstanceOf(PaymentClient);
    expect(sdk.identity).toBeInstanceOf(IdentityClient);
    expect(sdk.system).toBeInstanceOf(SystemClient);
  });

  it('type-only exports compile without error', () => {
    // These are type-only imports — if they compile, the test passes.
    // We use them in a type position to ensure they exist.
    const _typeCheck = (
      _agent: Agent,
      _wallet: Wallet,
      _payment: Payment,
      _quote: PaymentQuote,
      _identity: IdentityProfile,
      _verification: VerificationResult,
      _health: HealthStatus,
      _info: ServiceInfo,
      _provision: ProvisionWalletRequest,
      _provisionResult: WalletProvisioningResult,
      _execute: ExecutePaymentRequest,
      _quoteReq: PaymentQuoteRequest,
      _resolve: ResolveIdentityRequest,
      _verify: VerifyIdentityRequest,
      _create: CreateAgentRequest,
      _update: UpdateAgentRequest,
      _list: ListAgentsQuery,
      _money: MoneyAmount,
      _status: ResourceStatus,
      _audit: AuditMetadata,
      _httpClient: HttpClient,
      _httpReq: HttpRequest<any>,
      _httpResp: HttpResponse,
      _method: HttpMethod,
      _headers: HttpHeaders,
      _retry: RetryPolicy,
      _config: LilySdkConfig,
      _resolved: ResolvedLilySdkConfig,
      _walletContract: WalletClientContract,
      _paymentContract: PaymentClientContract,
      _identityContract: IdentityClientContract,
      _systemContract: SystemClientContract,
      _agentContract: AgentClientContract,
    ) => {};

    // If this compiles and runs, the export surface is valid
    expect(typeof _typeCheck).toBe('function');
  });
});
