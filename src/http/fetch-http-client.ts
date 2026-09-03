import type { ResolvedLilySdkConfig } from '../config/types';
import { resolveAuthHeaders } from './resolve-auth-headers';
import {
  LILY_ERROR_CODES,
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
  LilyValidationError,
} from '../errors/sdk-error';
import type {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from './types';

export function createFetchHttpClient(
  config: ResolvedLilySdkConfig,
): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(
      request: HttpRequest<TRequest>,
    ): Promise<HttpResponse<TResponse>> {
      const url = buildUrl(config.baseUrl, request.path, request.query);
      const body = serializeBody(request.body);
      const headers = buildHeaders(config, body, request.headers);
      const timeoutMs = request.timeoutMs ?? config.timeoutMs;

      let attempt = 0;
      let externalAbortHandler: (() => void) | undefined;

      for (;;) {
        const controller = new AbortController();
        if (request.signal) {
          if (request.signal.aborted) {
            throw new LilyTransportError('Request cancelled by caller.', {
              code: 'CANCELLED',
              cause: request.signal.reason ?? new Error('Aborted'),
            });
          }
          externalAbortHandler = () => controller.abort(request.signal!.reason);
          request.signal.addEventListener('abort', externalAbortHandler, { once: true });
        }
        const timeout = setTimeout(() => {
          if (abortSource === undefined) {
            abortSource = 'timeout';
            controller.abort();
          }
        }, timeoutMs);

        const body = serializeBody(request.body);
        const requestInit: RequestInit = {
          method: request.method,
          headers,
          ...(controller ? { signal: controller.signal } : {}),
        };

        if (body !== undefined) {
          requestInit.body = body;
        }

        try {
          const response = await config.fetch(url, requestInit);

          const data = (await parseResponse(response)) as TResponse;

          if (response.ok) {
            clearTimeout(timeout);
            if (externalAbortHandler && request.signal) {
              request.signal.removeEventListener('abort', externalAbortHandler);
            }
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
            throw new LilyAuthenticationError('Authentication failed for Lily Protocol API.', {
              code: LILY_ERROR_CODES.AUTHENTICATION_ERROR,
              statusCode: response.status,
              details: data,
              headers: Object.fromEntries(response.headers.entries()),
              request: { method: request.method, path: request.path, url: url.toString() },
            });
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
            clearTimeout(timeout);
            if (externalAbortHandler && request.signal) {
              request.signal.removeEventListener('abort', externalAbortHandler);
            }
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }

          throw new LilyApiError('Lily Protocol API request failed.', {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: data,
            headers: Object.fromEntries(response.headers.entries()),
            request: { method: request.method, path: request.path, url: url.toString() },
          });
        } catch (error) {
          clearTimeout(timeout);
          if (externalAbortHandler && request.signal) {
            request.signal.removeEventListener('abort', externalAbortHandler);
          }

          if (
            error instanceof LilyApiError ||
            error instanceof LilyAuthenticationError
          ) {
            throw error;
          }

          if (error instanceof Error && error.name === 'AbortError') {
            throw new LilyTransportError('Request timed out while calling Lily Protocol API.', {
              code: LILY_ERROR_CODES.TIMEOUT,
              cause: error,
              request: { method: request.method, path: request.path, url: url.toString() },
            });
          }

          if (
            attempt < config.retry.retries &&
            isRetryableTransportError(error, request.method)
          ) {
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }

          throw new LilyTransportError('Network error while calling Lily Protocol API.', {
            code: LILY_ERROR_CODES.TRANSPORT_ERROR,
            cause: error,
            request: { method: request.method, path: request.path, url: url.toString() },
          });
        }
      }
    },
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

function normalizeHeaders(init?: HeadersInit): Record<string, string> {
  const result: Record<string, string> = {};

  if (!init) {
    return result;
  }

  if (init instanceof Headers) {
    init.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(init)) {
    for (const [key, value] of init) {
      result[key] = value;
    }
    return result;
  }

  return { ...init };
}

function buildHeaders(
  config: ResolvedLilySdkConfig,
  body: BodyInit | undefined,
  requestHeaders?: HttpHeaders,
): HttpHeaders {
  return {
    accept: 'application/json',
    'user-agent': config.userAgent,
    ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...config.defaultHeaders,
    ...resolveAuthHeaders(config),
    ...requestHeaders,
  };
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body);
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as unknown;
    } catch (error) {
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
  retryableStatusCodes: readonly number[],
  method: string,
): boolean {
  return (
    isRetryableMethod(method) &&
    attempt < maxRetries &&
    [408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode)
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
