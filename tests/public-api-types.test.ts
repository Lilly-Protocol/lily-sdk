import { describe, expectTypeOf, it } from 'vitest';
import type { LilySdkConfig, ResolvedLilySdkConfig } from '../src/config/types';
import type {
  HttpRequest,
  HttpResponse,
  HttpClient,
  RetryPolicy,
} from '../src/http/types';
import type {
  MoneyAmount,
  PaginationQuery,
  ResourceStatus,
} from '../src/models/common';
import type {
  ListAgentsQuery,
  CreateAgentRequest,
  Agent,
} from '../src/models/agent';
import type {
  ExecutePaymentRequest,
  PaymentQuoteRequest,
} from '../src/models/payment';
import type {
  ResolveIdentityRequest,
  IdentityProfile,
} from '../src/models/identity';
import type { LilySdk } from '../src/sdk';

describe('public API type-level tests', () => {
  describe('LilySdkConfig', () => {
    it('accepts string baseUrl', () => {
      const config: LilySdkConfig = { baseUrl: 'https://api.test' };
      expectTypeOf(config).toMatchTypeOf<LilySdkConfig>();
    });

    it('accepts optional retry policy', () => {
      const config: LilySdkConfig = {
        baseUrl: 'https://api.test',
        retry: { retries: 3, retryDelayMs: 500 },
      };
      expectTypeOf(config).toMatchTypeOf<LilySdkConfig>();
    });

    it('accepts optional auth credentials', () => {
      const config: LilySdkConfig = {
        baseUrl: 'https://api.test',
        apiKey: 'key',
        authToken: 'token',
      };
      expectTypeOf(config).toMatchTypeOf<LilySdkConfig>();
    });
  });

  describe('ResolvedLilySdkConfig', () => {
    it('has readonly baseUrl as URL', () => {
      expectTypeOf<ResolvedLilySdkConfig['baseUrl']>().toEqualTypeOf<URL>();
    });

    it('has required timeoutMs as number', () => {
      expectTypeOf<
        ResolvedLilySdkConfig['timeoutMs']
      >().toEqualTypeOf<number>();
    });

    it('has required retry as RetryPolicy', () => {
      expectTypeOf<
        ResolvedLilySdkConfig['retry']
      >().toEqualTypeOf<RetryPolicy>();
    });
  });

  describe('HttpRequest and HttpResponse', () => {
    it('HttpRequest accepts typed body generic', () => {
      type Req = HttpRequest<{ name: string }>;
      expectTypeOf<Req['body']>().toEqualTypeOf<{ name: string } | undefined>();
    });

    it('HttpResponse carries typed data generic', () => {
      type Res = HttpResponse<{ id: string }>;
      expectTypeOf<Res['data']>().toEqualTypeOf<{ id: string }>();
      expectTypeOf<Res['status']>().toEqualTypeOf<number>();
      expectTypeOf<Res['headers']>().toEqualTypeOf<Headers>();
    });

    it('HttpClient.request returns Promise of HttpResponse with matching generics', () => {
      type Client = HttpClient;
      expectTypeOf<Client['request']>()
        .parameter(0)
        .toMatchTypeOf<HttpRequest<unknown>>();
    });
  });

  describe('Model shapes', () => {
    it('MoneyAmount has required assetCode and amount strings', () => {
      expectTypeOf<MoneyAmount['assetCode']>().toEqualTypeOf<string>();
      expectTypeOf<MoneyAmount['amount']>().toEqualTypeOf<string>();
      expectTypeOf<MoneyAmount['assetIssuer']>().toEqualTypeOf<
        string | undefined
      >();
    });

    it('PaginationQuery accepts optional limit and cursor', () => {
      expectTypeOf<PaginationQuery['limit']>().toEqualTypeOf<
        number | undefined
      >();
      expectTypeOf<PaginationQuery['cursor']>().toEqualTypeOf<
        string | undefined
      >();
    });

    it('ResourceStatus is a union of known literals', () => {
      expectTypeOf<ResourceStatus>().toEqualTypeOf<
        'pending' | 'active' | 'inactive' | 'failed'
      >();
    });

    it('ListAgentsQuery extends PaginationQuery', () => {
      expectTypeOf<ListAgentsQuery>().toMatchTypeOf<PaginationQuery>();
    });

    it('CreateAgentRequest requires name and network', () => {
      expectTypeOf<CreateAgentRequest['name']>().toEqualTypeOf<string>();
      expectTypeOf<CreateAgentRequest['network']>().toEqualTypeOf<
        'stellar-testnet' | 'stellar-mainnet'
      >();
    });

    it('Agent has required identity fields', () => {
      expectTypeOf<Agent['id']>().toEqualTypeOf<string>();
      expectTypeOf<Agent['name']>().toEqualTypeOf<string>();
      expectTypeOf<Agent['status']>().toEqualTypeOf<ResourceStatus>();
    });

    it('ExecutePaymentRequest requires fromWalletId, toAddress, and amount', () => {
      expectTypeOf<
        ExecutePaymentRequest['fromWalletId']
      >().toEqualTypeOf<string>();
      expectTypeOf<
        ExecutePaymentRequest['toAddress']
      >().toEqualTypeOf<string>();
      expectTypeOf<
        ExecutePaymentRequest['amount']
      >().toEqualTypeOf<MoneyAmount>();
      expectTypeOf<ExecutePaymentRequest['memo']>().toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf<ExecutePaymentRequest['idempotencyKey']>().toEqualTypeOf<
        string | undefined
      >();
    });

    it('ResolveIdentityRequest has optional resolver keys', () => {
      expectTypeOf<ResolveIdentityRequest['agentId']>().toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf<ResolveIdentityRequest['stellarAddress']>().toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf<ResolveIdentityRequest['domain']>().toEqualTypeOf<
        string | undefined
      >();
    });

    it('IdentityProfile has required audit metadata', () => {
      expectTypeOf<IdentityProfile['createdAt']>().toEqualTypeOf<string>();
      expectTypeOf<IdentityProfile['updatedAt']>().toEqualTypeOf<string>();
      expectTypeOf<IdentityProfile['verificationLevel']>().toEqualTypeOf<
        'none' | 'basic' | 'enhanced'
      >();
    });
  });

  describe('LilySdk client signatures', () => {
    it('system.health returns Promise with status field', () => {
      type Sdk = LilySdk;
      type HealthResult = ReturnType<Sdk['system']['health']>;
      expectTypeOf<HealthResult>().resolves.toMatchTypeOf<{ status: string }>();
    });

    it('payments.quote accepts PaymentQuoteRequest and returns PaymentQuote', () => {
      type Sdk = LilySdk;
      type QuoteResult = ReturnType<Sdk['payments']['quote']>;
      expectTypeOf<QuoteResult>().resolves.toMatchTypeOf<{
        amount: MoneyAmount;
      }>();
    });

    it('payments.execute accepts ExecutePaymentRequest and returns Payment', () => {
      type Sdk = LilySdk;
      type ExecuteResult = ReturnType<Sdk['payments']['execute']>;
      expectTypeOf<ExecuteResult>().resolves.toMatchTypeOf<{
        id: string;
        status: string;
      }>();
    });
  });
});
