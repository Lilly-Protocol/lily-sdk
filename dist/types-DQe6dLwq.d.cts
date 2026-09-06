type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type HttpHeaders = Record<string, string>;
interface RetryPolicy {
    retries: number;
    retryDelayMs: number;
    retryableStatusCodes: number[];
}
interface HttpRequest<TBody = unknown> {
    method: HttpMethod;
    path: string;
    headers?: HttpHeaders;
    query?: Record<string, string | number | boolean | (string | number)[] | undefined>;
    body?: TBody;
    /** Request timeout in milliseconds. Set to `0` to disable the timeout for this request. */
    timeoutMs?: number;
    signal?: AbortSignal;
}
interface HttpResponse<TData = unknown> {
    status: number;
    headers: Headers;
    data: TData;
    /** Number of attempts made (including the initial request). 1 means no retries. */
    attempts?: number;
    /** True if at least one retry was performed before receiving this response. */
    retried?: boolean;
}
interface HttpClient {
    request<TResponse, TRequest = unknown>(request: HttpRequest<TRequest>): Promise<HttpResponse<TResponse>>;
}

interface LilySdkConfig {
    baseUrl?: string | URL;
    apiKey?: string;
    authToken?: string;
    timeoutMs?: number;
    retry?: Partial<RetryPolicy>;
    defaultHeaders?: Record<string, string>;
    userAgent?: string;
    fetch?: typeof globalThis.fetch;
    /** Enable runtime response validation for known models. Default: false. */
    validateResponses?: boolean;
}
interface LilySdkCreateOptions extends Omit<LilySdkConfig, 'baseUrl'> {
    baseUrl?: string;
}
type ResolvedRetryPolicy = RetryPolicy;
interface ResolvedLilySdkConfig {
    baseUrl: URL;
    apiKey?: string;
    authToken?: string;
    timeoutMs: number;
    retry: ResolvedRetryPolicy;
    defaultHeaders: Record<string, string>;
    userAgent: string;
    fetch: typeof globalThis.fetch;
    validateResponses?: boolean;
    /**
     * Serializes the resolved auth credentials plus default headers into a
     * plain header object. Returns a fresh object on every call.
     * Optional so mock configs and older custom clients stay compatible;
     * `resolveLilySdkConfig` always provides it.
     */
    toHeaders?(): Record<string, string>;
}

export type { HttpClient as H, LilySdkConfig as L, ResolvedLilySdkConfig as R, HttpHeaders as a, HttpMethod as b, HttpRequest as c, HttpResponse as d, LilySdkCreateOptions as e, RetryPolicy as f };
