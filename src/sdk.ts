import { AgentClient } from './clients/agent-client';
import { IdentityClient } from './clients/identity-client';
import { PaymentClient } from './clients/payment-client';
import { SystemClient } from './clients/system-client';
import { WalletClient } from './clients/wallet-client';
import { resolveLilySdkConfig } from './config/resolve-config';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './config/types';
import { createFetchHttpClient } from './http/fetch-http-client';
import type { HttpClient, HttpRequest } from './http/types';

export class LilySdk {
  public readonly config: ResolvedLilySdkConfig;
  public readonly agents: AgentClient;
  public readonly wallets: WalletClient;
  public readonly payments: PaymentClient;
  public readonly identity: IdentityClient;
  public readonly system: SystemClient;
  private readonly _httpClient: HttpClient;

  public constructor(config: LilySdkConfig, httpClient?: HttpClient) {
    this.config = resolveLilySdkConfig(config);
    const resolvedHttpClient = httpClient ?? createFetchHttpClient(this.config);

    this.agents = new AgentClient(resolvedHttpClient);
    this.wallets = new WalletClient(resolvedHttpClient);
    this.payments = new PaymentClient(resolvedHttpClient);
    this.identity = new IdentityClient(resolvedHttpClient);
    this.system = new SystemClient(resolvedHttpClient);
    this._httpClient = resolvedHttpClient;
  }

  /**
   * Typed passthrough for calling unmodeled or raw Lily endpoints.
   * Reuses the SDK's resolved config, headers, and HTTP client.
   *
   * @typeParam TResponse - Expected response data shape
   * @typeParam TRequest - Optional request body shape
   * @param request - The HTTP request descriptor (method, path, headers, query, body)
   * @returns The response data payload
   *
   * @example
   * ```ts
   * const result = await sdk.request<{ id: string }>({
   *   method: 'GET',
   *   path: '/v1/custom-endpoint',
   * });
   * ```
   */
  public async request<TResponse, TRequest = unknown>(
    request: HttpRequest<TRequest>,
  ): Promise<TResponse> {
    const response = await this._httpClient.request<TResponse, TRequest>(
      request,
    );
    return response.data;
  }
}
