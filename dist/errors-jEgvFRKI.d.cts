interface LilyRequestMetadata {
    method: string;
    path: string;
    url: string;
}
interface LilyErrorOptions {
    code?: string;
    statusCode?: number;
    details?: unknown;
    cause?: unknown;
    request?: LilyRequestMetadata;
    /** Redacted excerpt of the response body, safe to log or send to a bug tracker. */
    bodySnippet?: string;
    /** Delta-seconds value from a Retry-After header, when present. */
    retryAfterSeconds?: number;
}
declare const LILY_ERROR_CODES: Readonly<{
    CONFIG_ERROR: "CONFIG_ERROR";
    API_ERROR: "API_ERROR";
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR";
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR";
    VALIDATION_ERROR: "VALIDATION_ERROR";
    TRANSPORT_ERROR: "TRANSPORT_ERROR";
    NOT_FOUND: "NOT_FOUND";
    CONFLICT: "CONFLICT";
    RATE_LIMITED: "RATE_LIMITED";
    SERVER_ERROR: "SERVER_ERROR";
    TIMEOUT: "TIMEOUT";
}>;
type LilyErrorCode = keyof typeof LILY_ERROR_CODES;
declare class LilySdkError extends Error {
    readonly code: string | undefined;
    readonly statusCode: number | undefined;
    readonly details: unknown;
    readonly request: LilyRequestMetadata | undefined;
    constructor(message: string, options?: LilyErrorOptions);
    toJSON(): Record<string, unknown>;
    toString(): string;
}
declare class LilyConfigError extends LilySdkError {
}
declare class LilyTransportError extends LilySdkError {
}
declare class LilyAuthenticationError extends LilySdkError {
}
/**
 * Any non-ok HTTP response. The subclasses below narrow it, so
 * `catch (e) { if (e instanceof LilyApiError) ... }` keeps working for callers
 * that only care that the API rejected the request.
 */
declare class LilyApiError extends LilySdkError {
}
declare class LilyValidationError extends LilySdkError {
}
declare class LilyAuthorizationError extends LilyAuthenticationError {
}
declare class LilyNotFoundError extends LilyApiError {
}
declare class LilyConflictError extends LilyApiError {
}
declare class LilyServerError extends LilyApiError {
}
declare class LilyRateLimitError extends LilyApiError {
    readonly retryAfterSeconds: number | undefined;
    constructor(message: string, options?: LilyErrorOptions);
}
declare function isLilySdkError(value: unknown): value is LilySdkError;

export { LILY_ERROR_CODES as L, LilyApiError as a, LilyAuthenticationError as b, LilyAuthorizationError as c, LilyConfigError as d, LilyConflictError as e, type LilyErrorCode as f, LilyNotFoundError as g, LilyRateLimitError as h, LilySdkError as i, LilyServerError as j, LilyTransportError as k, LilyValidationError as l, isLilySdkError as m };
