export const LILY_ERROR_CODES = {
  API_ERROR: 'API_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
} as const;

export type LilyErrorCode =
  (typeof LILY_ERROR_CODES)[keyof typeof LILY_ERROR_CODES];

export interface LilyErrorOptions {
  code?: string;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
}

export class LilySdkError extends Error {
  public readonly code: string | undefined;
  public readonly statusCode: number | undefined;
  public readonly details: unknown;

  public constructor(message: string, options: LilyErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
  }
}

export class LilyConfigError extends LilySdkError {}
export class LilyTransportError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}
export class LilyAuthenticationError extends LilySdkError {}
export class LilyApiError extends LilySdkError {}

export function isLilySdkError(value: unknown): value is LilySdkError {
  return value instanceof LilySdkError;
}
