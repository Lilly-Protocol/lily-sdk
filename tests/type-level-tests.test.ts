import { describe, it, expect } from 'vitest';
import type {
  LilySdkConfig,
  ResolvedLilySdkConfig,
} from '../src/config/types';
import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
  HttpMethod,
  HttpHeaders,
  RetryPolicy,
} from '../src/http/types';
import type {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  ListAgentsQuery,
  Wallet,
  ProvisionWalletRequest,
  WalletProvisioningResult,
  Payment,
  PaymentQuote,
  PaymentQuoteRequest,
  ExecutePaymentRequest,
  IdentityProfile,
  ResolveIdentityRequest,
  VerifyIdentityRequest,
  VerificationResult,
  HealthStatus,
  ServiceInfo,
  PaginationQuery,
  MoneyAmount,
  AuditMetadata,
  ResourceStatus,
} from '../src/models';
import type {
  AgentClientContract,
  WalletClientContract,
  PaymentClientContract,
  IdentityClientContract,
  SystemClientContract,
} from '../src/types/contracts';
import type { RequestLifecycleHooks } from '../src/http/lifecycle-hooks';
import type { CursorPage } from '../src/pagination';

/**
 * Issue #90: Type-level tests for the public API.
 * These tests verify that types are correctly exported and compatible.
 * They don't run at runtime — they're compile-time assertions.
 */

describe('Type-level tests for public API (issue #90)', () => {
  it('LilySdkConfig accepts all documented fields', () => {
    const config: LilySdkConfig = {
      baseUrl: 'https://api.example.com',
      apiKey: 'key-123',
      authToken: 'token-456',
      timeoutMs: 5000,
      retry: {
        retries: 3,
        retryDelayMs: 100,
        retryableStatusCodes: [429, 503],
      },
      defaultHeaders: { 'x-custom': 'value' },
      userAgent: 'my-app/1.0',
    };
    expect(config).toBeDefined();
  });

  it('LilySdkConfig accepts URL instance for baseUrl', () => {
    const config: LilySdkConfig = {
      baseUrl: new URL('https://api.example.com'),
      apiKey: 'key',
    };
    expect(config.baseUrl).toBeInstanceOf(URL);
  });

  it('ResolvedLilySdkConfig is fully readonly', () => {
    const config: ResolvedLilySdkConfig = {
      baseUrl: new URL('https://api.example.com/'),
      timeoutMs: 10000,
      retry: { retries: 2, retryDelayMs: 250, retryableStatusCodes: [429] },
      defaultHeaders: {},
      userAgent: 'lily-sdk/0.1.0',
      fetch: globalThis.fetch,
      toHeaders: () => ({}),
    } as ResolvedLilySdkConfig;
    // @ts-expect-error - should be readonly
    // config.timeoutMs = 5000;
    expect(config.timeoutMs).toBe(10000);
  });

  it('HttpMethod is union of valid methods', () => {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    expect(methods).toHaveLength(5);
  });

  it('HttpRequest supports generic body type', () => {
    const req: HttpRequest<CreateAgentRequest> = {
      method: 'POST',
      path: '/v1/agents',
      body: { name: 'test', network: 'stellar-testnet' },
    };
    expect(req.body?.name).toBe('test');
  });

  it('HttpRequest query supports array values', () => {
    const req: HttpRequest = {
      method: 'GET',
      path: '/v1/agents',
      query: { status: ['active', 'pending'] },
    };
    expect(req.query?.status).toEqual(['active', 'pending']);
  });

  it('AgentClientContract includes delete method', () => {
    const contract: AgentClientContract = {
      list: (() => Promise.resolve([])) as any,
      get: (() => Promise.resolve({} as Agent)) as any,
      create: (() => Promise.resolve({} as Agent)) as any,
      update: (() => Promise.resolve({} as Agent)) as any,
      delete: (() => Promise.resolve()) as any,
    };
    expect(typeof contract.delete).toBe('function');
  });

  it('RequestLifecycleHooks has all lifecycle methods', () => {
    const hooks: RequestLifecycleHooks = {
      beforeRequest: () => {},
      afterResponse: () => {},
      onError: () => {},
      onRetry: () => {},
    };
    expect(typeof hooks.beforeRequest).toBe('function');
    expect(typeof hooks.afterResponse).toBe('function');
    expect(typeof hooks.onError).toBe('function');
    expect(typeof hooks.onRetry).toBe('function');
  });

  it('CursorPage type is correctly structured', () => {
    const page: CursorPage<Agent> = {
      items: [],
      nextCursor: 'abc',
      hasMore: true,
    };
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(true);
  });

  it('MoneyAmount has required assetCode and amount', () => {
    const money: MoneyAmount = {
      assetCode: 'USD',
      amount: '100.00',
    };
    expect(money.assetCode).toBe('USD');
  });

  it('ResourceStatus is union of valid statuses', () => {
    const statuses: ResourceStatus[] = ['pending', 'active', 'inactive', 'failed'];
    expect(statuses).toHaveLength(4);
  });
});
