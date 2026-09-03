import type { RetryPolicy } from '../http/types';

export interface LilySdkConfig {
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

export interface LilySdkCreateOptions extends Omit<LilySdkConfig, 'baseUrl'> {
  baseUrl?: string;
}

export interface ResolvedRetryPolicy extends RetryPolicy {}

export interface ResolvedLilySdkConfig {
  readonly baseUrl: URL;
  readonly apiKey?: string;
  readonly authToken?: string;
  readonly timeoutMs: number;
  readonly retry: ResolvedRetryPolicy;
  readonly defaultHeaders: Readonly<Record<string, string>>;
  readonly userAgent: string;
  readonly fetch: typeof globalThis.fetch;
  readonly validateResponses?: boolean;
  /**
   * Serializes the resolved auth credentials plus default headers into a
   * plain header object. Returns a fresh object on every call.
   */
  toHeaders?(): Record<string, string>;
}
