import type { RetryPolicy } from '../http/types';

export interface LilySdkConfig {
  baseUrl?: string;
  apiKey?: string;
  authToken?: string;
  timeoutMs?: number;
  retry?: Partial<RetryPolicy>;
  defaultHeaders?: Record<string, string>;
  userAgent?: string;
  fetch?: typeof globalThis.fetch;
}

export interface ResolvedLilySdkConfig {
  readonly baseUrl: URL;
  readonly apiKey?: string;
  readonly authToken?: string;
  readonly timeoutMs: number;
  readonly retry: RetryPolicy;
  readonly defaultHeaders: Readonly<Record<string, string>>;
  readonly userAgent: string;
  readonly fetch: typeof globalThis.fetch;
}
