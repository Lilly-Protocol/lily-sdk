import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './config/types';
import { createFetchHttpClient } from './http/fetch-http-client';
import type { HttpClient } from './http/types';
import type { HttpRequest } from './http/types';

export class LilySdk {
  public readonly config: ResolvedLilySdkConfig;
  private readonly httpClient: HttpClient;
  public readonly agents: AgentClient;
  public readonly wallets: WalletClient;
  public readonly payments: PaymentClient;
  public readonly identity: IdentityClient;
  public readonly system: SystemClient;
  private readonly httpClient: HttpClient;

  public static create(config?: Partial<LilySdkConfig>, httpClient?: HttpClient): LilySdk {
    return new LilySdk(config, httpClient);
  }

  public constructor(config?: Partial<LilySdkConfig>, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig((config ?? {}));
    const resolvedHttpClient = httpClient ?? createFetchHttpClient(this.config);
    this.httpClient = resolvedHttpClient;

    this.agents = new AgentClient(this.httpClient);
    this.wallets = new WalletClient(this.httpClient);
    this.payments = new PaymentClient(this.httpClient);
    this.identity = new IdentityClient(this.httpClient);
    this.system = new SystemClient(this.httpClient);
  }

  /**
   * Sends a typed request using the SDK's shared HttpClient.
   * Returns only the response data, mirroring BaseClient.request.
   */
  public async request<TResponse, TRequest = undefined>(
    request: HttpRequest<TRequest>,
  ): Promise<TResponse> {
    const response = await this.httpClient.request<TResponse, TRequest>(request);
    return response.data;
  }

  /**
   * Convenience factory to create a LilySdk instance with sensible defaults from environment variables.
   */
  public static create(config?: Partial<LilySdkConfig>, httpClient?: HttpClient): LilySdk {
    const baseUrl =
      config?.baseUrl ??
      (typeof process !== 'undefined'
        ? process.env?.LILY_BASE_URL ?? process.env?.LILY_API_URL
        : undefined) ??
      'https://api.lilyprotocol.org';

    const apiKey =
      config?.apiKey ??
      (typeof process !== 'undefined' ? process.env?.LILY_API_KEY : undefined);

    const authToken =
      config?.authToken ??
      (typeof process !== 'undefined' ? process.env?.LILY_AUTH_TOKEN : undefined);

    return new LilySdk(
      {
        baseUrl,
        ...(apiKey ? { apiKey } : {}),
        ...(authToken ? { authToken } : {}),
        ...config,
      },
      httpClient,
    );
  }

  /**
   * Creates a LilySdk instance with zero-config defaults.
   * Reads LILY_API_URL, LILY_API_KEY, and LILY_AUTH_TOKEN from environment.
   * Explicit options override environment variables.
   */
  public static create(options?: Partial<LilySdkConfig>): LilySdk {
    const envBaseUrl = process.env.LILY_API_URL;
    const envApiKey = process.env.LILY_API_KEY;
    const envAuthToken = process.env.LILY_AUTH_TOKEN;

    const baseUrl = options?.baseUrl ?? envBaseUrl;
    if (!baseUrl) {
      throw new Error(
        'baseUrl is required. Pass it in options or set LILY_API_URL environment variable.',
      );
    }

    const config: LilySdkConfig = {
      baseUrl,
    };

    const apiKey = options?.apiKey ?? envApiKey;
    if (apiKey !== undefined) {
      config.apiKey = apiKey;
    }

    const authToken = options?.authToken ?? envAuthToken;
    if (authToken !== undefined) {
      config.authToken = authToken;
    }

    if (options?.timeoutMs !== undefined) config.timeoutMs = options.timeoutMs;
    if (options?.retry !== undefined) config.retry = options.retry;
    if (options?.defaultHeaders !== undefined) config.defaultHeaders = options.defaultHeaders;
    if (options?.userAgent !== undefined) config.userAgent = options.userAgent;
    if (options?.fetch !== undefined) config.fetch = options.fetch;

    return new LilySdk(config);
  }

  /**
   * Creates a new LilySdk instance with merged configuration.
   * Useful for multi-tenant scenarios where credentials or baseUrl differ per tenant.
   */
  public withConfig(overrides: Partial<LilySdkConfig>): LilySdk {
    // Construct a fresh config object from resolved values to satisfy
    // exactOptionalPropertyTypes. Only defined overrides replace base values.
    const merged: LilySdkConfig = {
      baseUrl: overrides.baseUrl ?? String(this.config.baseUrl),
      timeoutMs: overrides.timeoutMs ?? this.config.timeoutMs,
      retry: overrides.retry ?? this.config.retry,
      defaultHeaders: overrides.defaultHeaders ?? Object.fromEntries(Object.entries(this.config.defaultHeaders)),
      userAgent: overrides.userAgent ?? this.config.userAgent,
      fetch: overrides.fetch ?? this.config.fetch,
    };

    if (overrides.apiKey !== undefined) {
      merged.apiKey = overrides.apiKey;
    } else if (this.config.apiKey !== undefined) {
      merged.apiKey = this.config.apiKey;
    }

    if (overrides.authToken !== undefined) {
      merged.authToken = overrides.authToken;
    } else if (this.config.authToken !== undefined) {
      merged.authToken = this.config.authToken;
    }

    return new LilySdk(merged);
  }

  /**
   * Creates a new LilySdk instance with merged configuration.
   * Useful for multi-tenant scenarios where credentials or baseUrl differ per tenant.
   */
  public withConfig(overrides: Partial<LilySdkConfig>): LilySdk {
    const merged: LilySdkConfig = {
      baseUrl: this.config.baseUrl.toString(),
      ...(this.config.apiKey !== undefined && { apiKey: this.config.apiKey }),
      ...(this.config.authToken !== undefined && { authToken: this.config.authToken }),
      timeoutMs: this.config.timeoutMs,
      retry: { ...this.config.retry },
      defaultHeaders: { ...this.config.defaultHeaders },
      userAgent: this.config.userAgent,
      fetch: this.config.fetch,
      ...overrides,
    };
    return new LilySdk(merged, this.httpClient);
  }
}

