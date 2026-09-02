export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpHeaders = Record<string, string>;

export interface RetryPolicy {
  retries: number;
  retryDelayMs: number;
  retryableStatusCodes: number[];
}

export interface HttpRequest<TBody = unknown> {
  method: HttpMethod;
  path: string;
  headers?: HttpHeaders;
  query?: Record<string, string | number | boolean | undefined>;
  body?: TBody;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<TData = unknown> {
  status: number;
  headers: Headers;
  data: TData;
}

export interface HttpClient {
  request<TResponse, TRequest = unknown>(request: HttpRequest<TRequest>): Promise<HttpResponse<TResponse>>;
}
