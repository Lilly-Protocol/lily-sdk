import {
  LilyApiError,
  LilyAuthenticationError,
  LilyAuthorizationError,
  LilyConflictError,
  LilyNotFoundError,
  LilyRateLimitError,
  LilyServerError,
  LilyValidationError,
  type LilyErrorOptions,
} from '../errors/sdk-error';
import { extractHeaders } from './fetch-http-client';

/** Longest excerpt of a response body attached to an error. */
export const BODY_SNIPPET_MAX_LENGTH = 256;

/**
 * Keys whose values are replaced before a body is turned into a snippet.
 * Matched case-insensitively as substrings, so `apiKey`, `X-API-KEY` and
 * `refresh_token` are all covered.
 */
const SENSITIVE_KEY_PATTERN =
  /(pass|secret|token|api[-_]?key|authorization|credential|signature|private)/i;

const REDACTED = '[redacted]';

function redact(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  if (value !== null && typeof value === 'object') {
    // A server can return a cyclic structure; JSON.stringify would throw on it
    // and we would lose the snippet entirely.
    if (seen.has(value)) {
      return '[circular]';
    }
    seen.add(value);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(item, seen),
      ]),
    );
  }

  return value;
}

/**
 * A short, redacted excerpt of a response body, safe to log or paste into a
 * bug report.
 *
 * Error bodies are the one place an API is most likely to echo back what you
 * sent it — including the credential that was rejected — so values under
 * sensitive-looking keys are replaced rather than truncated. Truncation alone
 * is not redaction: a 20-character token fits comfortably inside the limit.
 */
export function safeBodySnippet(body: unknown): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  let text: string;

  if (typeof body === 'string') {
    text = body;
  } else {
    // `body` always comes from parseResponse, i.e. JSON.parse or response
    // text, so it is never a function or symbol and stringify always yields a
    // string here. The catch is for exotic values a JSON body can still hold,
    // such as a BigInt, which throws.
    try {
      text = JSON.stringify(redact(body, new WeakSet()));
    } catch {
      return undefined; // never let snippet-building fail the error path
    }
  }

  text = text.trim();

  if (text.length === 0) {
    return undefined;
  }

  return text.length > BODY_SNIPPET_MAX_LENGTH
    ? `${text.slice(0, BODY_SNIPPET_MAX_LENGTH)}…`
    : text;
}

function retryAfterSeconds(headers: Headers | undefined): number | undefined {
  const raw = headers?.get('retry-after');

  if (raw === null || raw === undefined) {
    return undefined;
  }

  const seconds = Number(raw);

  // Retry-After may also be an HTTP date; only the delta-seconds form is
  // reported, rather than guessing at clock skew.
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/**
 * Map a non-ok HTTP response onto the narrowest SDK error class.
 *
 * Every returned error is a `LilySdkError`, and every 4xx/5xx other than
 * 401 is a `LilyApiError`, so existing `instanceof` checks keep working while
 * callers that want to branch on "not found" versus "rate limited" now can.
 */
export function mapResponseError(
  status: number,
  data: unknown,
  headers?: Headers,
): LilyApiError | LilyAuthenticationError | LilyValidationError {
  const snippet = safeBodySnippet(data);
  const responseHeaders = extractHeaders(headers);
  const options: LilyErrorOptions = {
    statusCode: status,
    details: data,
    ...(snippet !== undefined ? { bodySnippet: snippet } : {}),
    ...(responseHeaders !== undefined ? { headers: responseHeaders } : {}),
  };

  if (status === 401) {
    return new LilyAuthenticationError(
      'Authentication failed for Lily Protocol API.',
      {
        ...options,
        code: 'AUTHENTICATION_ERROR',
      },
    );
  }

  if (status === 403) {
    return new LilyAuthorizationError(
      'Not authorized for this Lily Protocol resource.',
      {
        ...options,
        code: 'AUTHORIZATION_ERROR',
      },
    );
  }

  if (status === 400 || status === 422) {
    return new LilyValidationError(
      'Lily Protocol API rejected the request as invalid.',
      {
        ...options,
        code: 'VALIDATION_ERROR',
      },
    );
  }

  if (status === 404 || status === 410) {
    return new LilyNotFoundError('Lily Protocol API resource was not found.', {
      ...options,
      code: 'NOT_FOUND',
    });
  }

  if (status === 409) {
    return new LilyConflictError('Lily Protocol API reported a conflict.', {
      ...options,
      code: 'CONFLICT',
    });
  }

  if (status === 429) {
    const retryAfter = retryAfterSeconds(headers);
    return new LilyRateLimitError('Lily Protocol API rate limit exceeded.', {
      ...options,
      code: 'RATE_LIMITED',
      ...(retryAfter !== undefined ? { retryAfterSeconds: retryAfter } : {}),
    });
  }

  if (status >= 500) {
    return new LilyServerError('Lily Protocol API returned a server error.', {
      ...options,
      code: 'SERVER_ERROR',
    });
  }

  return new LilyApiError('Lily Protocol API request failed.', {
    ...options,
    code: 'API_ERROR',
  });
}
