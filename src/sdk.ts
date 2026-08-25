import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './config/types';
import { LilyConfigError } from './errors/sdk-error';
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
   * Zero-config factory that defaults `baseUrl` to the Lily Protocol production API.
   * Requires at least one of `apiKey` or `authToken`.
   */
  public static create(config: Omit<LilySdkConfig, 'baseUrl'>, httpClient?: HttpClient): LilySdk {
    if (!config.apiKey && !config.authToken) {
      throw new LilyConfigError(
        '`LilySdk.create()` requires at least one of `apiKey` or `authToken`.',
      );
    }

    return new LilySdk(
      {
        baseUrl: 'https://api.lily-protocol.dev',
        ...config,
      },
      httpClient,
    );
  }
}
