import type { ResolvedLilySdkConfig } from '../config/types';
import {
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
} from '../errors/sdk-error';
import type { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from './types';

export function createFetchHttpClient(config: ResolvedLilySdkConfig): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(
      request: HttpRequest<TRequest>,
    ): Promise<HttpResponse<TResponse>> {
      const url = buildUrl(config.baseUrl, request.path, request.query);
      const headers = buildHeaders(config, request.headers);
      const timeoutMs = request.timeoutMs ?? config.timeoutMs;

      let attempt = 0;

      for (;;) {
        const controller = new AbortController();
        if (request.signal) {
          if (request.signal.aborted) {
            throw new LilyTransportError('Request cancelled by caller.', {
              code: 'CANCELLED',
              cause: request.signal.reason ?? new Error('Aborted'),
            });
          }
          request.signal.addEventListener('abort', () => controller.abort(request.signal!.reason), { once: true });
        }
        const timeout = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        const body = serializeBody(request.body);
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
            clearTimeout(timeout);
            if (externalAbortHandler && request.signal) {
              request.signal.removeEventListener('abort', externalAbortHandler);
            }
            return {
              status: response.status,
              headers: response.headers,
              data,
            };
          }

         if (response.status === 401 || response.status === 403) {
           throw new LilyAuthenticationError('Authentication failed for Lily Protocol API.', {
             code: 'AUTHENTICATION_ERROR',
             statusCode: response.status,
             details: data,
             request: { method: request.method, path: request.path, url: url.toString() },
           });
         }

         if (shouldRetry(response.status, attempt, config.retry.retries, request.method)) {
            clearTimeout(timeout);
            if (externalAbortHandler && request.signal) {
              request.signal.removeEventListener('abort', externalAbortHandler);
            }
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }

         throw new LilyApiError('Lily Protocol API request failed.', {
           code: 'API_ERROR',
           statusCode: response.status,
           details: data,
           request: { method: request.method, path: request.path, url: url.toString() },
         });
       } catch (error) {
         clearTimeout(timeout);

          if (error instanceof LilyApiError || error instanceof LilyAuthenticationError) {
            throw error;
          }

         if (error instanceof Error && error.name === 'AbortError') {
           throw new LilyTransportError('Request timed out while calling Lily Protocol API.', {
             code: 'TIMEOUT',
             cause: error,
             request: { method: request.method, path: request.path, url: url.toString() },
           });
         }

         if (attempt < config.retry.retries && isRetryableTransportError(error, request.method)) {
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }

         throw new LilyTransportError('Network error while calling Lily Protocol API.', {
           code: 'TRANSPORT_ERROR',
           cause: error,
           request: { method: request.method, path: request.path, url: url.toString() },
         });
       }
     }
    },
  };
}

function buildUrl(
  baseUrl: URL,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): URL {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(cleanPath, baseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function buildHeaders(
  config: ResolvedLilySdkConfig,
  requestHeaders?: HttpHeaders,
): HttpHeaders {
  const headers: HttpHeaders = {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': config.userAgent,
    ...config.defaultHeaders,
    ...requestHeaders,
  };

  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  if (config.authToken) {
    headers.authorization = `Bearer ${config.authToken}`;
  }

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
    return (await response.json()) as unknown;
  }

  return await response.text();
}

function shouldRetry(
  statusCode: number,
  attempt: number,
  maxRetries: number,
  method: string,
): boolean {
  const isSafeOrIdempotent = method === 'GET' || method === 'PUT' || method === 'DELETE';

  return isSafeOrIdempotent && attempt < maxRetries && [408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode);
}

function isRetryableTransportError(error: unknown, method: string): boolean {
  const isSafeOrIdempotent = method === 'GET' || method === 'PUT' || method === 'DELETE';

  return isSafeOrIdempotent && error instanceof Error;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
