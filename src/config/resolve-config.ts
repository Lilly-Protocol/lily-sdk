import { VERSION } from '../version';
import type { LilySdkConfig, ResolvedLilySdkConfig } from './types';
import { LilyConfigError } from '../errors/sdk-error';
import { SDK_VERSION } from '../version';
import type { RetryPolicy } from '../http/types';
import { version } from '../../package.json' with { type: 'json' };

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = `lily-sdk/${version}`;
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
};

export function resolveLilySdkConfig(
  config: LilySdkConfig,
): ResolvedLilySdkConfig {
  if (!config.baseUrl) {
    throw new LilyConfigError('`baseUrl` is required.');
  }

  const baseUrl = safeUrl(rawBaseUrl);
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retry = Object.freeze(resolveRetryPolicy(config.retry));
  const fetchImpl = config.fetch ?? globalThis.fetch;
  const resolvedApiKey = resolveCredential(config.apiKey, 'LILY_API_KEY');
  const resolvedAuthToken = resolveCredential(config.authToken, 'LILY_AUTH_TOKEN');

  if (typeof fetchImpl !== 'function') {
    throw new LilyConfigError(
      'No fetch implementation was found. Pass `fetch` in the SDK config when running in unsupported runtimes.',
    );
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new LilyConfigError('`timeoutMs` must be a positive number.');
  }

  const apiKey = config.apiKey ?? process.env.LILY_API_KEY;
  const authToken = config.authToken ?? process.env.LILY_AUTH_TOKEN;

  return Object.freeze({
    baseUrl,
    timeoutMs,
    retry,
    defaultHeaders: Object.freeze({
      ...config.defaultHeaders,
    }),
    userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
    fetch: fetchImpl,
    ...(apiKey ? { apiKey } : {}),
    ...(authToken ? { authToken } : {}),
  });
}

function resolveCredential(
  explicit: string | undefined,
  envName: string,
): string | undefined {
  return explicit ?? process.env[envName] ?? undefined;
}

function resolveCredential(
  explicit: string | undefined,
  envName: string,
): string | undefined {
  return explicit ?? process.env[envName] ?? undefined;
}

function safeUrl(rawUrl: string): URL {
  try {
    return new URL(rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`);
  } catch {
    throw new LilyConfigError('`baseUrl` must be a valid absolute URL.');
  }
}

function resolveRetryPolicy(policy?: Partial<RetryPolicy>): RetryPolicy {
  const retries = policy?.retries ?? DEFAULT_RETRY_POLICY.retries;
  const retryDelayMs =
    policy?.retryDelayMs ?? DEFAULT_RETRY_POLICY.retryDelayMs;
  const retryableStatusCodes =
    policy?.retryableStatusCodes ?? DEFAULT_RETRY_POLICY.retryableStatusCodes;

  if (!Number.isInteger(retries) || retries < 0) {
    throw new LilyConfigError(
      '`retry.retries` must be a non-negative integer.',
    );
  }

  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new LilyConfigError(
      '`retry.retryDelayMs` must be a non-negative number.',
    );
  }

  return {
    retries,
    retryDelayMs,
    retryableStatusCodes,
  };
}
