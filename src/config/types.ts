import type { RetryPolicy } from '../http/types';

export interface LilySdkConfig {
  baseUrl?: string | URL;
  apiKey?: string | null;
  authToken?: string | null;
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

export type ResolvedRetryPolicy = RetryPolicy;

export interface ResolvedLilySdkConfig {
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

export { resolveLilySdkConfig } from './resolve-config';
