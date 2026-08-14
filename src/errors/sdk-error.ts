export interface LilyErrorOptions {
  code?: string;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
  /**
   * A short, redacted excerpt of the response body, for logs and bug reports.
   * See `safeBodySnippet` in `src/http/map-response-error.ts`.
   */
  bodySnippet?: string | undefined;
}

export class LilySdkError extends Error {
  public readonly code: string | undefined;
  public readonly statusCode: number | undefined;
  public readonly details: unknown;
  public readonly bodySnippet: string | undefined;

  public constructor(message: string, options: LilyErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.bodySnippet = options.bodySnippet;
  }
}

export class LilyConfigError extends LilySdkError {}
export class LilyTransportError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}
export class LilyAuthenticationError extends LilySdkError {}

/**
 * Any non-ok HTTP response. The subclasses below narrow it, so
 * `catch (e) { if (e instanceof LilyApiError) ... }` keeps working for callers
 * that only care that the API rejected the request.
 */
export class LilyApiError extends LilySdkError {}

/** 403: authenticated, but not allowed to do this. */
export class LilyAuthorizationError extends LilyAuthenticationError {}

/** 404 / 410: the resource is not there. */
export class LilyNotFoundError extends LilyApiError {}

/** 409: the request conflicts with the current state. */
export class LilyConflictError extends LilyApiError {}

/** 429: rate limited. Carries `retryAfterSeconds` when the server sent it. */
export class LilyRateLimitError extends LilyApiError {
  public readonly retryAfterSeconds: number | undefined;

  public constructor(
    message: string,
    options: LilyErrorOptions & { retryAfterSeconds?: number | undefined } = {},
  ) {
    super(message, options);
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

/** 5xx: the failure is on the server side, so retrying may help. */
export class LilyServerError extends LilyApiError {}
