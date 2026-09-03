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
  request?: {
    method: string;
    path: string;
    url: string;
  };
}

export class LilySdkError extends Error {
  public readonly code: string | undefined;
  public readonly statusCode: number | undefined;
  public readonly details: unknown;
  public readonly request: { method: string; path: string; url: string } | undefined;

  public constructor(message: string, options: LilyErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.request = options.request;
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
export class LilyAuthenticationError extends LilySdkError {}
export class LilyApiError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}
