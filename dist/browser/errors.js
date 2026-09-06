// src/errors/sdk-error.ts
var LILY_ERROR_CODES = Object.freeze({
  CONFIG_ERROR: "CONFIG_ERROR",
  API_ERROR: "API_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  TRANSPORT_ERROR: "TRANSPORT_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT"
});
var LilySdkError = class _LilySdkError extends Error {
  code;
  statusCode;
  details;
  request;
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.request = options.request;
  }
  toJSON() {
    const result = {
      name: this.name,
      message: this.message
    };
    if (this.code !== void 0) {
      result.code = this.code;
    }
    if (this.statusCode !== void 0) {
      result.statusCode = this.statusCode;
    }
    if (this.details !== void 0) {
      result.details = this.details;
    }
    if (this.request !== void 0) {
      result.request = this.request;
    }
    const cause = this.cause;
    if (cause !== void 0 && cause !== null) {
      result.cause = cause instanceof _LilySdkError ? cause.toJSON() : cause instanceof Error ? { name: cause.name, message: cause.message } : cause;
    }
    return result;
  }
  toString() {
    const parts = [this.name, this.message];
    if (this.code !== void 0) {
      parts.push(`[${this.code}]`);
    }
    if (this.statusCode !== void 0) {
      parts.push(`(HTTP ${this.statusCode})`);
    }
    return parts.join(": ");
  }
};
var LilyConfigError = class extends LilySdkError {
};
var LilyTransportError = class extends LilySdkError {
};
var LilyAuthenticationError = class extends LilySdkError {
};
var LilyApiError = class extends LilySdkError {
};
var LilyAuthorizationError = class extends LilyAuthenticationError {
};
var LilyNotFoundError = class extends LilyApiError {
};
var LilyConflictError = class extends LilyApiError {
};
var LilyServerError = class extends LilyApiError {
};
var LilyRateLimitError = class extends LilyApiError {
  retryAfterSeconds;
  constructor(message, options = {}) {
    super(message, options);
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
};

export { LILY_ERROR_CODES, LilyApiError, LilyAuthenticationError, LilyAuthorizationError, LilyConfigError, LilyConflictError, LilyNotFoundError, LilyRateLimitError, LilySdkError, LilyServerError, LilyTransportError };
//# sourceMappingURL=errors.js.map
//# sourceMappingURL=errors.js.map