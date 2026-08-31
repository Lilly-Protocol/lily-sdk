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
   * Creates a new LilySdk instance with sensible defaults.
   * Reads LILY_API_URL and LILY_API_KEY from environment variables if not provided.
   * Explicit options always take precedence over environment variables.
   */
  public static create(options?: Partial<LilySdkConfig>): LilySdk {
    const baseUrl = options?.baseUrl ?? process.env.LILY_API_URL;
    const apiKey = options?.apiKey ?? process.env.LILY_API_KEY;

    if (!baseUrl) {
      throw new Error(
        'baseUrl is required. Provide it in options or set the LILY_API_URL environment variable.',
      );
    }

    return new LilySdk({
      ...options,
      baseUrl,
      ...(apiKey ? { apiKey } : {}),
    });
  }
}
