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
}

export class LilySdkError extends Error {
  public readonly code: string | undefined;
  public readonly statusCode: number | undefined;
  public readonly details: unknown;
  public readonly request: LilyRequestMetadata | undefined;

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
