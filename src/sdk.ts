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
  private readonly httpClient: HttpClient;

  public constructor(config: LilySdkConfig | ResolvedLilySdkConfig, httpClient?: HttpClient) {
    this.config = 'baseUrl' in config && typeof (config as LilySdkConfig).baseUrl === 'string'
      ? resolveLilySdkConfig(config as LilySdkConfig)
      : (config as ResolvedLilySdkConfig);
    const resolvedHttpClient = httpClient ?? createFetchHttpClient(this.config);
    this.httpClient = resolvedHttpClient;

    this.agents = new AgentClient(resolvedHttpClient);
    this.wallets = new WalletClient(resolvedHttpClient);
    this.payments = new PaymentClient(resolvedHttpClient);
    this.identity = new IdentityClient(resolvedHttpClient);
    this.system = new SystemClient(resolvedHttpClient);
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
