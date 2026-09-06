// src/errors/sdk-error.ts
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

// src/version.ts
var SDK_VERSION = "0.1.0";
var VERSION = SDK_VERSION;

// src/http/resolve-auth-headers.ts
function toBearer(token) {
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}

// src/config/resolve-config.ts
var DEFAULT_TIMEOUT_MS = 1e4;
var DEFAULT_USER_AGENT = `lily-sdk/${VERSION}`;
var DEFAULT_RETRY_POLICY = {
  retries: 2,
  retryDelayMs: 250,
  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504]
};
var KNOWN_CONFIG_KEYS = [
  "baseUrl",
  "apiKey",
  "authToken",
  "timeoutMs",
  "retry",
  "defaultHeaders",
  "userAgent",
  "fetch",
  "validateResponses"
];
function resolveLilySdkConfig(config) {
  const unknownKeys = Object.keys(config).filter(
    (key) => !KNOWN_CONFIG_KEYS.includes(key)
  );
  if (unknownKeys.length > 0) {
    console.warn(
      `[lily-sdk] Ignoring unknown config keys: ${unknownKeys.join(", ")}`
    );
  }
  const baseUrl = resolveBaseUrl(config.baseUrl);
  if (config.apiKey !== void 0 && (typeof config.apiKey !== "string" || config.apiKey.trim() === "")) {
    throw new LilyConfigError("`apiKey` must be a non-empty string.");
  }
  if (config.authToken !== void 0 && (typeof config.authToken !== "string" || config.authToken.trim() === "")) {
    throw new LilyConfigError("`authToken` must be a non-empty string.");
  }
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retry = resolveRetryPolicy(config.retry);
  const fetchImpl = config.fetch ?? globalThis.fetch;
  const resolvedApiKey = resolveCredential(config.apiKey, "LILY_API_KEY");
  const resolvedAuthToken = resolveCredential(
    config.authToken,
    "LILY_AUTH_TOKEN"
  );
  const validateResponses = config.validateResponses ?? true;
  if (typeof fetchImpl !== "function") {
    throw new LilyConfigError(
      "No fetch implementation was found. Pass `fetch` in the SDK config when running in unsupported runtimes."
    );
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new LilyConfigError("`timeoutMs` must be a positive number.");
  }
  const defaultHeaders = Object.freeze({
    ...config.defaultHeaders
  });
  return deepFreeze({
    baseUrl,
    timeoutMs,
    retry,
    defaultHeaders,
    userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
    fetch: fetchImpl,
    ...resolvedApiKey !== void 0 ? { apiKey: resolvedApiKey } : {},
    ...resolvedAuthToken !== void 0 ? { authToken: resolvedAuthToken } : {},
    validateResponses,
    toHeaders: () => ({
      accept: "application/json",
      "user-agent": config.userAgent ?? DEFAULT_USER_AGENT,
      ...defaultHeaders,
      ...resolvedApiKey !== void 0 ? { "x-api-key": resolvedApiKey } : {},
      ...resolvedAuthToken !== void 0 ? { authorization: toBearer(resolvedAuthToken) } : {}
    })
  });
}
function resolveBaseUrl(explicit) {
  const raw = explicit ?? (typeof process !== "undefined" ? process.env.LILY_API_URL : void 0);
  if (raw === void 0) {
    throw new LilyConfigError("`baseUrl` is required.");
  }
  return safeUrl(raw);
}
function resolveCredential(explicit, envName) {
  return explicit ?? process.env[envName] ?? void 0;
}
function safeUrl(rawUrl) {
  let url;
  try {
    if (rawUrl instanceof URL) {
      url = new URL(
        rawUrl.href.endsWith("/") ? rawUrl.href : `${rawUrl.href}/`
      );
    } else {
      url = new URL(rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`);
    }
  } catch {
    throw new LilyConfigError("`baseUrl` must be a valid absolute URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new LilyConfigError(
      "`baseUrl` must use http: or https: protocol, got: " + url.protocol
    );
  }
  return url;
}
function resolveRetryPolicy(policy) {
  const retries = policy?.retries ?? DEFAULT_RETRY_POLICY.retries;
  const retryDelayMs = policy?.retryDelayMs ?? DEFAULT_RETRY_POLICY.retryDelayMs;
  const retryableStatusCodes = policy?.retryableStatusCodes ?? DEFAULT_RETRY_POLICY.retryableStatusCodes;
  if (!Number.isInteger(retries) || retries < 0) {
    throw new LilyConfigError(
      "`retry.retries` must be a non-negative integer."
    );
  }
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new LilyConfigError(
      "`retry.retryDelayMs` must be a non-negative number."
    );
  }
  if (!Array.isArray(retryableStatusCodes)) {
    throw new LilyConfigError(
      "`retry.retryableStatusCodes` must be an array of HTTP status codes."
    );
  }
  for (const code of retryableStatusCodes) {
    if (!Number.isInteger(code) || code < 100 || code > 599) {
      throw new LilyConfigError(
        `Invalid retry status code: ${code}. Must be an integer between 100 and 599.`
      );
    }
  }
  return {
    retries,
    retryDelayMs,
    retryableStatusCodes: [...retryableStatusCodes]
  };
}
function deepFreeze(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    if (typeof nestedValue === "function") {
      continue;
    }
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}

export { resolveLilySdkConfig };
//# sourceMappingURL=config.js.map
//# sourceMappingURL=config.js.map