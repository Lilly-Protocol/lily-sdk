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

  /**
   * Returns a plain JSON-serializable object representation of this error.
   */
  public toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      name: this.name,
      message: this.message,
    };

    if (this.code !== undefined) {
      json.code = this.code;
    }

    if (this.statusCode !== undefined) {
      json.statusCode = this.statusCode;
    }

    if (this.details !== undefined) {
      json.details = this.details;
    }

    return json;
  }

  /**
   * Returns a rich string representation including code and statusCode.
   */
  public override toString(): string {
    let str = `${this.name}: ${this.message}`;

    if (this.code !== undefined) {
      str += ` [code: ${this.code}]`;
    }

    if (this.statusCode !== undefined) {
      str += ` (HTTP ${this.statusCode})`;
    }

    return str;
  }
}

export class LilyConfigError extends LilySdkError {}
export class LilyTransportError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}
export class LilyAuthenticationError extends LilySdkError {}
export class LilyApiError extends LilySdkError {}

/**
 * Immutable map of well-known Lily SDK error codes.
 */
export const LILY_ERROR_CODES = Object.freeze({
  CONFIG_ERROR: 'CONFIG_ERROR',
  API_ERROR: 'API_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const);

/**
 * Type guard that returns true if the given value is an instance of LilySdkError
 * (or any subclass thereof).
 */
export function isLilySdkError(value: unknown): value is LilySdkError {
  return value instanceof LilySdkError;
}
