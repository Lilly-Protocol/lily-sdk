import type { HttpClient, HttpRequest } from '../http/types';

export abstract class BaseClient {
  public constructor(protected readonly httpClient: HttpClient) {}

  protected buildPath(...segments: string[]): string {
    return `/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
  }

  protected async request<TResponse, TRequest = undefined>(
    request: HttpRequest<TRequest>,
  ): Promise<TResponse> {
    const response = await this.httpClient.request<TResponse, TRequest>(request);
    return response.data;
  }
}
