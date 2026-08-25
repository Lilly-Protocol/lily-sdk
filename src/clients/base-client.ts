import { LilyValidationError } from '../errors/sdk-error';
import type { HttpClient, HttpRequest } from '../http/types';

export abstract class BaseClient {
  public constructor(protected readonly httpClient: HttpClient) {}

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
