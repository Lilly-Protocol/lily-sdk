import type {
  LilySdkConfig,
  ResolvedLilySdkConfig,
  ResolvedRetryPolicy,
} from './types';
import { LilyConfigError } from '../errors/sdk-error';
import { VERSION } from '../version';
import type { RetryPolicy } from '../http/types';
import { toBearer } from '../http/resolve-auth-headers';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = `lily-sdk/${VERSION}`;
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
};

export function resolveLilySdkConfig(
  config: LilySdkConfig,
): ResolvedLilySdkConfig {
  const baseUrl = resolveBaseUrl(config.baseUrl);

  if (
    config.apiKey !== undefined &&
    (typeof config.apiKey !== 'string' || config.apiKey.trim() === '')
  ) {
    throw new LilyConfigError('`apiKey` must be a non-empty string.');
  }

  if (
    config.authToken !== undefined &&
    (typeof config.authToken !== 'string' || config.authToken.trim() === '')
  ) {
    throw new LilyConfigError('`authToken` must be a non-empty string.');
  }

  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retry = resolveRetryPolicy(config.retry);
  const fetchImpl = config.fetch ?? globalThis.fetch;
  const resolvedApiKey = resolveCredential(config.apiKey, 'LILY_API_KEY');
  const resolvedAuthToken = resolveCredential(
    config.authToken,
    'LILY_AUTH_TOKEN',
  );
  const validateResponses = config.validateResponses ?? true;

  if (typeof fetchImpl !== 'function') {
    throw new LilyConfigError(
      'No fetch implementation was found. Pass `fetch` in the SDK config when running in unsupported runtimes.',
    );
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new LilyConfigError('`timeoutMs` must be a positive number.');
  }

  const defaultHeaders = Object.freeze({
    ...config.defaultHeaders,
  });

  return deepFreeze({
    baseUrl,
    timeoutMs,
    retry,
    defaultHeaders,
    userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
    fetch: fetchImpl,
    ...(resolvedApiKey !== undefined ? { apiKey: resolvedApiKey } : {}),
    ...(resolvedAuthToken !== undefined ? { authToken: resolvedAuthToken } : {}),
    validateResponses,
    toHeaders: () => ({
      accept: 'application/json',
      'user-agent': config.userAgent ?? DEFAULT_USER_AGENT,
      ...defaultHeaders,
      ...(resolvedApiKey !== undefined ? { 'x-api-key': resolvedApiKey } : {}),
      ...(resolvedAuthToken !== undefined
        ? { authorization: toBearer(resolvedAuthToken) }
        : {}),
    }),
  });
}

function resolveBaseUrl(explicit: string | URL | undefined): URL {
  const raw =
    explicit ??
    (typeof process !== 'undefined'
      ? process.env.LILY_API_URL
      : undefined);

  if (raw === undefined) {
    throw new LilyConfigError('`baseUrl` is required.');
  }

  return safeUrl(raw);
}

function resolveCredential(
  explicit: string | undefined,
  envName: string,
): string | undefined {
  return explicit ?? process.env[envName] ?? undefined;
}

function safeUrl(rawUrl: string | URL): URL {
  let url: URL;

  try {
    if (rawUrl instanceof URL) {
      url = new URL(
        rawUrl.href.endsWith('/') ? rawUrl.href : `${rawUrl.href}/`,
      );
    } else {
      url = new URL(rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`);
    }
  } catch {
    throw new LilyConfigError('`baseUrl` must be a valid absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new LilyConfigError(
      '`baseUrl` must use http: or https: protocol, got: ' + url.protocol,
    );
  }

  return url;
}

function resolveRetryPolicy(
  policy?: Partial<RetryPolicy>,
): ResolvedRetryPolicy {
  const retries = policy?.retries ?? DEFAULT_RETRY_POLICY.retries;
  const retryDelayMs =
    policy?.retryDelayMs ?? DEFAULT_RETRY_POLICY.retryDelayMs;
  const retryableStatusCodes =
    policy?.retryableStatusCodes ?? DEFAULT_RETRY_POLICY.retryableStatusCodes;

  if (!Number.isInteger(retries) || retries < 0) {
    throw new LilyConfigError('`retry.retries` must be a non-negative integer.');
  }

  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new LilyConfigError(
      '`retry.retryDelayMs` must be a non-negative number.',
    );
  }

  if (!Array.isArray(retryableStatusCodes)) {
    throw new LilyConfigError(
      '`retry.retryableStatusCodes` must be an array of HTTP status codes.',
    );
  }

  for (const code of retryableStatusCodes) {
    if (!Number.isInteger(code) || code < 100 || code > 599) {
      throw new LilyConfigError(
        `Invalid retry status code: ${code}. Must be an integer between 100 and 599.`,
      );
    }
  }

  return {
    retries,
    retryDelayMs,
    retryableStatusCodes: [...retryableStatusCodes],
  };
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    if (typeof nestedValue === 'function') {
      continue;
    }
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}
