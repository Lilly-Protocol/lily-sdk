import type { LilySdkConfig, ResolvedLilySdkConfig } from './types';
import { LilyConfigError } from '../errors/sdk-error';
import type { RetryPolicy } from '../http/types';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = 'lily-sdk/0.1.0';
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
};

const KNOWN_CONFIG_KEYS = new Set([
  'baseUrl',
  'apiKey',
  'authToken',
  'timeoutMs',
  'retry',
  'defaultHeaders',
  'userAgent',
  'fetch',
]);

export function resolveLilySdkConfig(
  config: LilySdkConfig,
): ResolvedLilySdkConfig {
  detectUnknownKeys(config);

  if (!config.baseUrl) {
    throw new LilyConfigError('`baseUrl` is required.');
  }

  const baseUrl = safeUrl(config.baseUrl);
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retry = resolveRetryPolicy(config.retry);
  const fetchImpl = config.fetch ?? globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new LilyConfigError(
      'No fetch implementation was found. Pass `fetch` in the SDK config when running in unsupported runtimes.',
    );
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new LilyConfigError('`timeoutMs` must be a positive number.');
  }

  return {
    baseUrl,
    timeoutMs,
    retry,
    defaultHeaders: Object.freeze({
      ...config.defaultHeaders,
    }),
    userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
    fetch: fetchImpl,
    ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    ...(config.authToken ? { authToken: config.authToken } : {}),
  };
}

function detectUnknownKeys(config: LilySdkConfig): void {
  const unknownKeys = Object.keys(config).filter(
    (key) => !KNOWN_CONFIG_KEYS.has(key),
  );

  if (unknownKeys.length === 0) {
    return;
  }

  const suggestions = unknownKeys.map((key) => {
    const closest = findClosestKey(key);
    return closest ? `\`${key}\` (did you mean \`${closest}\`?)` : `\`${key}\``;
  });

  throw new LilyConfigError(
    `Unknown LilySdkConfig key(s): ${suggestions.join(', ')}. Known keys: ${[...KNOWN_CONFIG_KEYS].map((k) => `\`${k}\``).join(', ')}.`,
  );
}

function findClosestKey(unknown: string): string | undefined {
  let bestMatch: string | undefined;
  let bestScore = 0;

  for (const known of KNOWN_CONFIG_KEYS) {
    const score = similarityScore(unknown, known);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = known;
    }
  }

  // Only suggest if there's reasonable similarity (>0.4)
  return bestScore > 0.4 ? bestMatch : undefined;
}

function similarityScore(a: string, b: string): number {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();

  // Exact prefix match gets high score
  if (lowerB.startsWith(lowerA) || lowerA.startsWith(lowerB)) {
    return (
      Math.min(lowerA.length, lowerB.length) /
      Math.max(lowerA.length, lowerB.length)
    );
  }

  // Common substring ratio
  const commonChars = [...lowerA].filter((c) => lowerB.includes(c)).length;
  return commonChars / Math.max(lowerA.length, lowerB.length);
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
