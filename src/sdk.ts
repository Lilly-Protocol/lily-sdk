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

  public constructor(config: LilySdkConfig, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig(config);
    this.httpClient = httpClient ?? createFetchHttpClient(this.config);

    this.agents = new AgentClient(this.httpClient);
    this.wallets = new WalletClient(this.httpClient);
    this.payments = new PaymentClient(this.httpClient);
    this.identity = new IdentityClient(this.httpClient);
    this.system = new SystemClient(this.httpClient);
  }

  /**
   * Creates a new LilySdk instance with merged configuration overrides.
   * Useful for multi-tenant scenarios where credentials or baseUrl differ per tenant.
   * Shares the underlying HttpClient transport shape but applies new config resolution.
   */
  public withConfig(overrides: Partial<LilySdkConfig>): LilySdk {
    const merged: LilySdkConfig = {
      baseUrl: overrides.baseUrl ?? this.config.baseUrl.toString(),
      apiKey: overrides.apiKey ?? this.config.apiKey,
      authToken: overrides.authToken ?? this.config.authToken,
      timeoutMs: overrides.timeoutMs ?? this.config.timeoutMs,
      retry: overrides.retry ?? this.config.retry,
      defaultHeaders: overrides.defaultHeaders ?? this.config.defaultHeaders,
      userAgent: overrides.userAgent ?? this.config.userAgent,
      fetch: overrides.fetch ?? this.config.fetch,
    };
    return new LilySdk(merged, this.httpClient);
  }
}
