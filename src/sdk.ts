import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './config/types';
import { createFetchHttpClient } from './http/fetch-http-client';
import type { HttpClient } from './http/types';

export class LilySdk {
  public readonly config: ResolvedLilySdkConfig;
  public readonly agents: AgentClient;
  public readonly wallets: WalletClient;
  public readonly payments: PaymentClient;
  public readonly identity: IdentityClient;
  public readonly system: SystemClient;

  public constructor(config: LilySdkConfig, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig(config);
    const resolvedHttpClient = httpClient ?? createFetchHttpClient(this.config);

    this.agents = new AgentClient(resolvedHttpClient);
    this.wallets = new WalletClient(resolvedHttpClient);
    this.payments = new PaymentClient(resolvedHttpClient);
    this.identity = new IdentityClient(resolvedHttpClient);
    this.system = new SystemClient(resolvedHttpClient);
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
}
