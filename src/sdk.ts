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
   * Sends a raw HTTP request through the SDK's shared transport layer.
   *
   * This is a typed passthrough that delegates to the internal `HttpClient`,
   * reusing the resolved SDK config (baseUrl, headers, auth, retry, timeout).
   * It returns only the response `data`, consistent with `BaseClient.request`.
   *
   * Use this when you need to call an endpoint that does not yet have a
   * dedicated client method, or when you need full control over the request.
   *
   * @typeParam TResponse - The expected response payload type.
   * @typeParam TRequest  - The request body type (defaults to `undefined`).
   * @param request - A full `HttpRequest` descriptor.
   * @returns The deserialized response data.
   *
   * @example
   * ```ts
   * const sdk = new LilySdk({ baseUrl: 'https://api.lily.dev', apiKey: 'sk_...' });
   * const health = await sdk.request<{ status: string }>({
   *   method: 'GET',
   *   path: '/health',
   * });
   * ```
   */
  public async request<TResponse, TRequest = undefined>(
    request: HttpRequest<TRequest>,
  ): Promise<TResponse> {
    const response = await this.httpClient.request<TResponse, TRequest>(
      request,
    );
    return response.data;
  }
}
