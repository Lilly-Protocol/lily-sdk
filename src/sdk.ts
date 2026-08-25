import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type {
  LilySdkConfig,
  LilySdkCreateOptions,
  ResolvedLilySdkConfig,
} from './config/types';
import { createFetchHttpClient } from './http/fetch-http-client';
import type { HttpClient } from './http/types';

const DEFAULT_API_URL = 'https://api.lilyprotocol.com';

export class LilySdk {
  public readonly config: ResolvedLilySdkConfig;
  public readonly agents: AgentClient;
  public readonly wallets: WalletClient;
  public readonly payments: PaymentClient;
  public readonly identity: IdentityClient;
  public readonly system: SystemClient;

  /**
   * Creates an SDK using Lily's public API and credentials from the environment.
   * Explicit options take precedence over environment variables.
   */
  public static create(options: LilySdkCreateOptions = {}): LilySdk {
    const environment =
      typeof process === 'undefined' ? undefined : process.env;

    return new LilySdk({
      ...(environment?.LILY_API_KEY
        ? { apiKey: environment.LILY_API_KEY }
        : {}),
      ...(environment?.LILY_AUTH_TOKEN
        ? { authToken: environment.LILY_AUTH_TOKEN }
        : {}),
      ...options,
      baseUrl: options.baseUrl ?? environment?.LILY_API_URL ?? DEFAULT_API_URL,
    });
  }

  public constructor(config: LilySdkConfig, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig(config);
    const resolvedHttpClient = httpClient ?? createFetchHttpClient(this.config);

    this.agents = new AgentClient(resolvedHttpClient);
    this.wallets = new WalletClient(resolvedHttpClient);
    this.payments = new PaymentClient(resolvedHttpClient);
    this.identity = new IdentityClient(resolvedHttpClient);
    this.system = new SystemClient(resolvedHttpClient);
  }
}
