import { R as ResolvedLilySdkConfig, H as HttpClient } from './types-DQe6dLwq.cjs';
export { a as HttpHeaders, b as HttpMethod, c as HttpRequest, d as HttpResponse, f as RetryPolicy } from './types-DQe6dLwq.cjs';

declare function createFetchHttpClient(config: ResolvedLilySdkConfig): HttpClient;
declare function buildUrl(baseUrl: URL, path: string, query?: Record<string, string | number | boolean | (string | number)[] | undefined>): URL;

export { HttpClient, buildUrl, createFetchHttpClient };
