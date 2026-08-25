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
}

export class LilyConfigError extends LilySdkError {}
export class LilyTransportError extends LilySdkError {}
export class LilyValidationError extends LilySdkError {}
export class LilyAuthenticationError extends LilySdkError {}
export class LilyApiError extends LilySdkError {}
