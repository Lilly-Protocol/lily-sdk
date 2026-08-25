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
   * Creates an independent SDK instance by merging overrides with this instance's config.
   */
  public withConfig(overrides: Partial<LilySdkConfig>): LilySdk {
    return new LilySdk({
      baseUrl: this.config.baseUrl.toString(),
      timeoutMs: this.config.timeoutMs,
      retry: this.config.retry,
      defaultHeaders: this.config.defaultHeaders,
      userAgent: this.config.userAgent,
      fetch: this.config.fetch,
      ...(this.config.apiKey ? { apiKey: this.config.apiKey } : {}),
      ...(this.config.authToken ? { authToken: this.config.authToken } : {}),
      ...overrides,
      ...(overrides.retry
        ? {
            retry: {
              ...this.config.retry,
              ...overrides.retry,
            },
          }
        : {}),
    });
  }
}
