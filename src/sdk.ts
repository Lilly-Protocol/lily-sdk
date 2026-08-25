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
   * Creates a LilySdk instance with sensible defaults from environment variables.
   * Explicit options always win over env vars.
   *
   * Env vars read:
   * - LILY_API_URL (default: https://api.lilyprotocol.com)
   * - LILY_API_KEY
   * - LILY_AUTH_TOKEN
   */
  public static create(
    options?: Partial<LilySdkConfig>,
    httpClient?: HttpClient,
  ): LilySdk {
    const baseUrl =
      options?.baseUrl ??
      process.env.LILY_API_URL ??
      'https://api.lilyprotocol.com';
    const apiKey = options?.apiKey ?? process.env.LILY_API_KEY;
    const authToken = options?.authToken ?? process.env.LILY_AUTH_TOKEN;

    const config: LilySdkConfig = {
      baseUrl,
      ...(apiKey ? { apiKey } : {}),
      ...(authToken ? { authToken } : {}),
      ...options,
    };

    return new LilySdk(config, httpClient);
  }
}
