import type { HttpClient, HttpRequest } from '../http/types';
import type { ResolvedLilySdkConfig } from '../config/types';
import { createFetchHttpClient } from '../http/fetch-http-client';

export abstract class BaseClient {
  protected readonly httpClient: HttpClient;
  protected readonly config?: ResolvedLilySdkConfig;

  public constructor(httpClientOrConfig: HttpClient | ResolvedLilySdkConfig) {
    if ('request' in httpClientOrConfig && typeof (httpClientOrConfig as HttpClient).request === 'function') {
      this.httpClient = httpClientOrConfig as HttpClient;
    } else {
      const cfg = httpClientOrConfig as ResolvedLilySdkConfig;
      this.config = cfg;
      this.httpClient = createFetchHttpClient(cfg);
    }
  }

  protected async request<TResponse, TRequest = undefined>(
    request: HttpRequest<TRequest>,
  ): Promise<TResponse> {
    const response = await this.httpClient.request<TResponse, TRequest>(
      request,
    );
    return response.data;
  }
}
