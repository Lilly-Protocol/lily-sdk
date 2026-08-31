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
}
