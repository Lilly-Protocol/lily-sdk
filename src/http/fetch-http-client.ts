import type { ResolvedLilySdkConfig } from '../config/types';
import { resolveAuthHeaders } from './resolve-auth-headers';
import {
  LILY_ERROR_CODES,
  LilyApiError,
  LilyAuthenticationError,
  LilySdkError,
  LilyTransportError,
  LilyValidationError,
} from '../errors/sdk-error';
import type {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from './types';

import { DEFAULT_RETRYABLE_STATUS_CODES } from '../config/defaults';

export function createFetchHttpClient(
  config: ResolvedLilySdkConfig,
): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(
      request: HttpRequest<TRequest>,
    ): Promise<HttpResponse<TResponse>> {
      const url = buildUrl(config.baseUrl, request.path, request.query);
      const body = serializeBody(request.body);
      const headers = buildHeaders(config, request.headers);
      const timeoutMs = request.timeoutMs ?? config.timeoutMs;

      let attempt = 0;

      for (;;) {
        const controller = new AbortController();
        let externallyAborted = false;
        let onExternalAbort: (() => void) | undefined;

        if (request.signal) {
          if (request.signal.aborted) {
            throw new LilyTransportError('Request cancelled by caller.', {
              code: 'CANCELLED',
              cause: request.signal.reason ?? new Error('Aborted'),
              request: requestMetadata(request, url),
            });
          }

          onExternalAbort = () => {
            externallyAborted = true;
            controller.abort(request.signal?.reason);
          };
          request.signal.addEventListener('abort', onExternalAbort, {
            once: true,
          });
        }

        let timeout: ReturnType<typeof setTimeout> | undefined;
        if (timeoutMs > 0) {
          timeout = setTimeout(() => controller.abort(), timeoutMs);
        }

        const cleanup = (): void => {
          if (timeout !== undefined) {
            clearTimeout(timeout);
          }
          if (request.signal && onExternalAbort) {
            request.signal.removeEventListener('abort', onExternalAbort);
          }
        };

        const requestInit: RequestInit = {
          method: request.method,
          headers,
          signal: controller.signal,
        };

        if (body !== undefined) {
          requestInit.body = body;
        }

        try {
          const response = await config.fetch(url, requestInit);

          const data = (await parseResponse(response)) as TResponse;

          if (response.ok) {
            cleanup();
            return {
              status: response.status,
              headers: response.headers,
              data,
              attempts: attempt + 1,
              retried: attempt > 0,
            };
          }

          // Auth failures are terminal: retrying with the same credential just
          // burns the budget. Checked before shouldRetry for that reason.
          if (response.status === 401 || response.status === 403) {
            cleanup();
            throw new LilyAuthenticationError(
              'Authentication failed for Lily Protocol API.',
              {
                code: LILY_ERROR_CODES.AUTHENTICATION_ERROR,
                statusCode: response.status,
                details: data,
                request: requestMetadata(request, url),
              },
            );
          }

          if (
            shouldRetry(
              response.status,
              attempt,
              config.retry.retries,
              config.retry.retryableStatusCodes,
              request.method,
            )
          ) {
            cleanup();
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }

          cleanup();
          throw new LilyApiError('Lily Protocol API request failed.', {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: data,
            request: requestMetadata(request, url),
          });
        } catch (error) {
          cleanup();

          // LilySdkError instances (validation, auth, API) are definitive:
          // they must never be retried or re-wrapped.
          if (error instanceof LilySdkError) {
            throw error;
          }

          if (error instanceof Error && error.name === 'AbortError') {
            // External cancellation is never retried: the caller asked us to stop.
            if (
              !externallyAborted &&
              attempt < config.retry.retries &&
              isRetryableMethod(request.method)
            ) {
              attempt += 1;
              await sleep(config.retry.retryDelayMs * attempt);
              continue;
            }

            throw new LilyTransportError(
              externallyAborted
                ? 'Request cancelled by caller while calling Lily Protocol API.'
                : 'Request timed out while calling Lily Protocol API.',
              {
                code: externallyAborted
                  ? 'CANCELLED'
                  : LILY_ERROR_CODES.TIMEOUT,
                cause: error,
                request: requestMetadata(request, url),
              },
            );
          }

          if (
            attempt < config.retry.retries &&
            isRetryableTransportError(error, request.method)
          ) {
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }

          throw new LilyTransportError(
            'Network error while calling Lily Protocol API.',
            {
              code: LILY_ERROR_CODES.TRANSPORT_ERROR,
              cause: error,
              request: requestMetadata(request, url),
            },
          );
        }
      }
    },
  };
}

function requestMetadata(
  request: HttpRequest,
  url: URL,
): { method: string; path: string; url: string } {
  return {
    method: request.method,
    path: request.path,
    url: url.toString(),
  };
}

export function buildUrl(
  baseUrl: URL,
  path: string,
  query?: Record<
    string,
    string | number | boolean | (string | number)[] | undefined
  >,
): URL {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(cleanPath, baseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function buildHeaders(
  config: ResolvedLilySdkConfig,
  requestHeaders?: HttpHeaders,
): HttpHeaders {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': config.userAgent,
    ...config.defaultHeaders,
    ...requestHeaders,
    ...resolveAuthHeaders(config),
  };

  return headers;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  return JSON.stringify(body);
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    // Read body once as text to avoid double-consumption, then parse.
    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      // For non-ok responses, surface the real HTTP error instead of a
      // validation error �� callers lose the actual status otherwise.
      if (!response.ok) {
        throw new LilyApiError(
          `Failed to parse response body as JSON (status ${response.status}, content-type: ${contentType}).`,
          {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: text,
            cause: error,
          },
        );
      }
      throw new LilyValidationError(
        `Failed to parse response body as JSON (status ${response.status}, content-type: ${contentType}).`,
        {
          code: 'RESPONSE_VALIDATION_ERROR',
          statusCode: response.status,
          cause: error,
        },
      );
    }
  }

  return await response.text();
}

function shouldRetry(
  statusCode: number,
  attempt: number,
  maxRetries: number,
  retryableStatusCodes: readonly number[] | undefined,
  method: string,
): boolean {
  const codes = retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  return (
    isRetryableMethod(method) &&
    attempt < maxRetries &&
    codes.includes(statusCode)
  );
}

function isRetryableTransportError(error: unknown, method: string): boolean {
  return isRetryableMethod(method) && error instanceof Error;
}

function isRetryableMethod(method: string): boolean {
  return method === 'GET' || method === 'PUT' || method === 'DELETE';
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
