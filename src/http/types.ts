export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpHeaders = HeadersInit;

export interface RetryPolicy {
  retries: number;
  retryDelayMs: number;
  retryableStatusCodes: number[];
}

export interface HttpRequest<TBody = unknown> {
  method: HttpMethod;
  path: string;
  headers?: HttpHeaders;
  query?: Record<
    string,
    string | number | boolean | (string | number)[] | undefined
  >;
  body?: TBody;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<TData = unknown> {
  status: number;
  headers: Headers;
  data: TData;
  /** Number of attempts made (including the initial request). 1 means no retries. */
  attempts?: number;
  /** True if at least one retry was performed before receiving this response. */
  retried?: boolean;
}

export interface HttpClient {
  request<TResponse, TRequest = unknown>(
    request: HttpRequest<TRequest>,
  ): Promise<HttpResponse<TResponse>>;
}
