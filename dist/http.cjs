'use strict';

// src/http/resolve-auth-headers.ts
function toBearer(token) {
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}
function resolveAuthHeaders(config) {
  const headers = {};
  if (config.apiKey !== void 0) {
    headers["x-api-key"] = config.apiKey;
  }
  if (config.authToken !== void 0) {
    headers.authorization = toBearer(config.authToken);
  }
  return headers;
}

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
var LilyTransportError = class extends LilySdkError {
};
var LilyAuthenticationError = class extends LilySdkError {
};
var LilyApiError = class extends LilySdkError {
};
var LilyValidationError = class extends LilySdkError {
};

// src/http/fetch-http-client.ts
var DEFAULT_RETRYABLE_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];
function createFetchHttpClient(config) {
  return {
    async request(request) {
      const url = buildUrl(config.baseUrl, request.path, request.query);
      const body = serializeBody(request.body);
      const headers = buildHeaders(config, request.headers);
      const timeoutMs = request.timeoutMs ?? config.timeoutMs;
      let attempt = 0;
      for (; ; ) {
        const controller = new AbortController();
        let externallyAborted = false;
        let onExternalAbort;
        if (request.signal) {
          if (request.signal.aborted) {
            throw new LilyTransportError("Request cancelled by caller.", {
              code: "CANCELLED",
              cause: request.signal.reason ?? new Error("Aborted"),
              request: requestMetadata(request, url)
            });
          }
          onExternalAbort = () => {
            externallyAborted = true;
            controller.abort(request.signal?.reason);
          };
          request.signal.addEventListener("abort", onExternalAbort, {
            once: true
          });
        }
        let timeout;
        if (timeoutMs > 0) {
          timeout = setTimeout(() => controller.abort(), timeoutMs);
        }
        const cleanup = () => {
          if (timeout !== void 0) {
            clearTimeout(timeout);
          }
          if (request.signal && onExternalAbort) {
            request.signal.removeEventListener("abort", onExternalAbort);
          }
        };
        const requestInit = {
          method: request.method,
          headers,
          signal: controller.signal
        };
        if (body !== void 0) {
          requestInit.body = body;
        }
        try {
          const response = await config.fetch(url, requestInit);
          const data = await parseResponse(response);
          if (response.ok) {
            cleanup();
            return {
              status: response.status,
              headers: response.headers,
              data,
              attempts: attempt + 1,
              retried: attempt > 0
            };
          }
          if (response.status === 401 || response.status === 403) {
            cleanup();
            throw new LilyAuthenticationError(
              "Authentication failed for Lily Protocol API.",
              {
                code: LILY_ERROR_CODES.AUTHENTICATION_ERROR,
                statusCode: response.status,
                details: data,
                request: requestMetadata(request, url)
              }
            );
          }
          if (shouldRetry(
            response.status,
            attempt,
            config.retry.retries,
            config.retry.retryableStatusCodes,
            request.method
          )) {
            cleanup();
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }
          cleanup();
          throw new LilyApiError("Lily Protocol API request failed.", {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: data,
            request: requestMetadata(request, url)
          });
        } catch (error) {
          cleanup();
          if (error instanceof LilySdkError) {
            throw error;
          }
          if (error instanceof Error && error.name === "AbortError") {
            if (!externallyAborted && attempt < config.retry.retries && isRetryableMethod(request.method)) {
              attempt += 1;
              await sleep(config.retry.retryDelayMs * attempt);
              continue;
            }
            throw new LilyTransportError(
              externallyAborted ? "Request cancelled by caller while calling Lily Protocol API." : "Request timed out while calling Lily Protocol API.",
              {
                code: externallyAborted ? "CANCELLED" : LILY_ERROR_CODES.TIMEOUT,
                cause: error,
                request: requestMetadata(request, url)
              }
            );
          }
          if (attempt < config.retry.retries && isRetryableTransportError(error, request.method)) {
            attempt += 1;
            await sleep(config.retry.retryDelayMs * attempt);
            continue;
          }
          throw new LilyTransportError(
            "Network error while calling Lily Protocol API.",
            {
              code: LILY_ERROR_CODES.TRANSPORT_ERROR,
              cause: error,
              request: requestMetadata(request, url)
            }
          );
        }
      }
    }
  };
}
function requestMetadata(request, url) {
  return {
    method: request.method,
    path: request.path,
    url: url.toString()
  };
}
function buildUrl(baseUrl, path, query) {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(cleanPath, baseUrl);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === void 0) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}
function buildHeaders(config, requestHeaders) {
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": config.userAgent,
    ...config.defaultHeaders,
    ...requestHeaders,
    ...resolveAuthHeaders(config)
  };
  return headers;
}
function serializeBody(body) {
  if (body === void 0 || body === null) {
    return void 0;
  }
  return JSON.stringify(body);
}
async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (error) {
      throw new LilyValidationError(
        `Failed to parse response body as JSON (status ${response.status}, content-type: ${contentType}).`,
        {
          code: "RESPONSE_VALIDATION_ERROR",
          statusCode: response.status,
          cause: error
        }
      );
    }
  }
  return await response.text();
}
function shouldRetry(statusCode, attempt, maxRetries, retryableStatusCodes, method) {
  const codes = retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  return isRetryableMethod(method) && attempt < maxRetries && codes.includes(statusCode);
}
function isRetryableTransportError(error, method) {
  return isRetryableMethod(method) && error instanceof Error;
}
function isRetryableMethod(method) {
  return method === "GET" || method === "PUT" || method === "DELETE";
}
async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

exports.buildUrl = buildUrl;
exports.createFetchHttpClient = createFetchHttpClient;
//# sourceMappingURL=http.cjs.map
//# sourceMappingURL=http.cjs.map