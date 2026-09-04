export interface LilyRequestMetadata {
  method: string;
  path: string;
  url: string;
}

export interface LilyErrorOptions {
  code?: string;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
  request?: LilyRequestMetadata;
  /** Redacted excerpt of the response body, safe to log or send to a bug tracker. */
  bodySnippet?: string;
  /** Delta-seconds value from a Retry-After header, when present. */
  retryAfterSeconds?: number;
  /** Response headers from a failing HTTP request. */
  headers?: Record<string, string>;
}

export const LILY_ERROR_CODES = Object.freeze({
  CONFIG_ERROR: 'CONFIG_ERROR',
  API_ERROR: 'API_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
});

export type LilyErrorCode = keyof typeof LILY_ERROR_CODES;

export class LilySdkError extends Error {
  public readonly code: string | undefined;
  public readonly statusCode: number | undefined;
  public readonly details: unknown;
  public readonly request: LilyRequestMetadata | undefined;
  public readonly headers: Record<string, string> | undefined;

  public constructor(message: string, options: LilyErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.request = options.request;
    this.headers = options.headers;
  }

  public toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      name: this.name,
      message: this.message,
    };

    if (this.code !== undefined) {
      result.code = this.code;
    }

    if (this.statusCode !== undefined) {
      result.statusCode = this.statusCode;
    }

    if (this.details !== undefined) {
      result.details = this.details;
    }

    if (this.request !== undefined) {
      result.request = this.request;
    }

    if (this.headers !== undefined) {
      result.headers = this.headers;
    }

    const cause = this.cause;
    if (cause !== undefined && cause !== null) {
      result.cause =
        cause instanceof LilySdkError
          ? cause.toJSON()
          : cause instanceof Error
            ? { name: cause.name, message: cause.message }
            : cause;
    }

    return result;
  }

  public override toString(): string {
    const parts: string[] = [this.name, this.message];

    if (this.code !== undefined) {
      parts.push(`[${this.code}]`);
    }

    if (this.statusCode !== undefined) {
      parts.push(`(HTTP ${this.statusCode})`);
    }

    return parts.join(': ');
  }
}

export class LilyConfigError extends LilySdkError {}
export class LilyTransportError extends LilySdkError {}
export class LilyAuthenticationError extends LilySdkError {}

/**
 * Any non-ok HTTP response. The subclasses below narrow it, so
 * `catch (e) { if (e instanceof LilyApiError) ... }` keeps working for callers
 * that only care that the API rejected the request.
 */
export class LilyApiError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}

export class LilyAuthorizationError extends LilyAuthenticationError {}
export class LilyNotFoundError extends LilyApiError {}
export class LilyConflictError extends LilyApiError {}
export class LilyServerError extends LilyApiError {}

export class LilyRateLimitError extends LilyApiError {
  public readonly retryAfterSeconds: number | undefined;

  public constructor(message: string, options: LilyErrorOptions = {}) {
    super(message, options);
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function isLilySdkError(value: unknown): value is LilySdkError {
  return value instanceof LilySdkError;
}
