/** Identifies the HTTP request that caused an SDK error. */
export interface LilyErrorRequest {
  method: string;
  path: string;
  url: string;
}

export interface LilyErrorOptions {
  code?: string;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
  /** The method, SDK path, and final URL of the failed HTTP request. */
  request?: LilyErrorRequest;
}

export class LilySdkError extends Error {
  public readonly code: string | undefined;
  public readonly statusCode: number | undefined;
  public readonly details: unknown;
  public readonly request: LilyErrorRequest | undefined;

  public constructor(message: string, options: LilyErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.request = options.request;
  }
}

export class LilyConfigError extends LilySdkError {}
export class LilyTransportError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}
export class LilyAuthenticationError extends LilySdkError {}
export class LilyApiError extends LilySdkError {}
