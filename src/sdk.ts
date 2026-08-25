import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './config/types';
import { LilyConfigError } from './errors/sdk-error';
import { createFetchHttpClient } from './http/fetch-http-client';
import type { HttpClient, HttpRequest, HttpResponse } from './http/types';
import { SDK_VERSION } from './version';

export class LilySdk {
  public static readonly version: string = SDK_VERSION;

  public readonly config: ResolvedLilySdkConfig;
  public readonly agents: AgentClient;
  public readonly wallets: WalletClient;
  public readonly payments: PaymentClient;
  public readonly identity: IdentityClient;
  public readonly system: SystemClient;

  private readonly _httpClient: HttpClient;

  public constructor(config: LilySdkConfig, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig(config);
    this._httpClient = httpClient ?? createFetchHttpClient(this.config);

    this.agents = new AgentClient(this._httpClient);
    this.wallets = new WalletClient(this._httpClient);
    this.payments = new PaymentClient(this._httpClient);
    this.identity = new IdentityClient(this._httpClient);
    this.system = new SystemClient(this._httpClient);
  }

  /**
   * Typed passthrough to the underlying HTTP client.
   * Useful for calling endpoints not covered by the typed clients.
   */
  public request<TResponse, TRequest = unknown>(
    request: HttpRequest<TRequest>,
  ): Promise<HttpResponse<TResponse>> {
    return this._httpClient.request<TResponse, TRequest>(request);
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
