import { LilyValidationError } from '../errors/sdk-error';
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

  protected requireNonEmptyString(
    value: unknown,
    field: string,
  ): asserts value is string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new LilyValidationError(
        `\`${field}\` must be a non-empty string.`,
        {
          code: 'VALIDATION_ERROR',
        },
      );
    }
  }

  protected requireAtLeastOneNonEmptyString(
    input: unknown,
    fields: readonly string[],
  ): void {
    if (
      typeof input !== 'object' ||
      input === null ||
      !fields.some((field) => {
        const value = (input as Record<string, unknown>)[field];
        return typeof value === 'string' && value.trim().length > 0;
      })
    ) {
      throw new LilyValidationError(
        `At least one of ${fields.map((field) => `\`${field}\``).join(', ')} must be a non-empty string.`,
        { code: 'VALIDATION_ERROR' },
      );
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
