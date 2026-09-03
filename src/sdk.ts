import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './config/types';
import { createFetchHttpClient } from './http/fetch-http-client';
import type { HttpClient, HttpRequest } from './http/types';
import { SDK_VERSION } from './version';

export const DEFAULT_API_URL = 'https://api.lilyprotocol.com';

export class LilySdk {
  public static readonly version: string = SDK_VERSION;

  public readonly config: ResolvedLilySdkConfig;
  public readonly httpClient: HttpClient;
  public get http(): HttpClient {
    return this.httpClient;
  }
  public readonly agents: AgentClient;
  public readonly wallets: WalletClient;
  public readonly payments: PaymentClient;
  public readonly identity: IdentityClient;
  public readonly system: SystemClient;

  public constructor(config?: Partial<LilySdkConfig>, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig(config ?? {});
    this.httpClient = httpClient ?? createFetchHttpClient(this.config);

    this.agents = new AgentClient(this.httpClient);
    this.wallets = new WalletClient(this.httpClient);
    this.payments = new PaymentClient(this.httpClient);
    this.identity = new IdentityClient(this.httpClient);
    this.system = new SystemClient(this.httpClient, {
      ...(this.config.validateResponses !== undefined
        ? { validateResponses: this.config.validateResponses }
        : {}),
    });
  }

  /**
   * Creates a LilySdk instance with sensible defaults from environment variables.
   * Explicit options always take precedence over environment variables.
   *
   * Env vars read:
   * - LILY_API_URL (or LILY_BASE_URL)
   * - LILY_API_KEY
   * - LILY_AUTH_TOKEN
   *
   * Throws if no baseUrl is provided and no env var is set.
   */
  public static create(
    options?: Partial<LilySdkConfig>,
    httpClient?: HttpClient,
  ): LilySdk {
    const baseUrl =
      options?.baseUrl ??
      (typeof process !== 'undefined'
        ? (process.env.LILY_API_URL ?? process.env.LILY_BASE_URL)
        : undefined) ??
      DEFAULT_API_URL;

    if (!baseUrl) {
      throw new Error(
        'baseUrl is required. Pass it in options or set the LILY_API_URL environment variable.',
      );
    }

    const apiKey =
      options?.apiKey ??
      (typeof process !== 'undefined' ? process.env.LILY_API_KEY : undefined);

    const authToken =
      options?.authToken ??
      (typeof process !== 'undefined'
        ? process.env.LILY_AUTH_TOKEN
        : undefined);

    const config: LilySdkConfig = {
      baseUrl,
      ...(apiKey !== undefined ? { apiKey } : {}),
      ...(authToken !== undefined ? { authToken } : {}),
    };

    return new LilySdk(config, httpClient);
  }

  /**
   * Sends a typed request using the SDK's shared HttpClient and returns the
   * parsed response data, mirroring the client method API.
   */
  public async request<TResponse, TRequest = unknown>(
    request: HttpRequest<TRequest>,
  ): Promise<TResponse> {
    const response = await this.httpClient.request<TResponse, TRequest>(
      request,
    );
    return response.data;
  }

  /**
   * Creates a new LilySdk instance with merged configuration.
   * Useful for multi-tenant scenarios where credentials or baseUrl differ per tenant.
   */
  public withConfig(overrides: Partial<LilySdkConfig>): LilySdk {
    const merged: LilySdkConfig = {
      baseUrl: overrides.baseUrl ?? String(this.config.baseUrl),
      timeoutMs: overrides.timeoutMs ?? this.config.timeoutMs,
      retry: {
        ...this.config.retry,
        ...overrides.retry,
      },
      defaultHeaders: {
        ...this.config.defaultHeaders,
        ...overrides.defaultHeaders,
      },
      userAgent: overrides.userAgent ?? this.config.userAgent,
      fetch: overrides.fetch ?? this.config.fetch,
      ...(overrides.apiKey !== undefined
        ? { apiKey: overrides.apiKey }
        : this.config.apiKey !== undefined
          ? { apiKey: this.config.apiKey }
          : {}),
      ...(overrides.authToken !== undefined
        ? { authToken: overrides.authToken }
        : this.config.authToken !== undefined
          ? { authToken: this.config.authToken }
          : {}),
      ...(overrides.validateResponses !== undefined
        ? { validateResponses: overrides.validateResponses }
        : this.config.validateResponses !== undefined
          ? { validateResponses: this.config.validateResponses }
          : {}),
    };

    return new LilySdk(merged);
  }
}
