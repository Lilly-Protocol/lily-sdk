'use strict';

// src/http/path.ts
function encodePathSegment(segment) {
  return encodeURIComponent(segment);
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
var LilyConfigError = class extends LilySdkError {
};
var LilyTransportError = class extends LilySdkError {
};
var LilyAuthenticationError = class extends LilySdkError {
};
var LilyApiError = class extends LilySdkError {
};
var LilyValidationError = class extends LilySdkError {
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
function isLilySdkError(value) {
  return value instanceof LilySdkError;
}

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

// src/clients/base-client.ts
var BaseClient = class {
  httpClient;
  config;
  constructor(httpClientOrConfig) {
    if ("request" in httpClientOrConfig && typeof httpClientOrConfig.request === "function") {
      this.httpClient = httpClientOrConfig;
    } else {
      const cfg = httpClientOrConfig;
      this.config = cfg;
      this.httpClient = createFetchHttpClient(cfg);
    }
  }
  requireNonEmptyString(value, field) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new LilyValidationError(
        `\`${field}\` must be a non-empty string.`,
        {
          code: "VALIDATION_ERROR"
        }
      );
    }
  }
  requireAtLeastOneNonEmptyString(input, fields) {
    if (typeof input !== "object" || input === null || !fields.some((field) => {
      const value = input[field];
      return typeof value === "string" && value.trim().length > 0;
    })) {
      throw new LilyValidationError(
        `At least one of ${fields.map((field) => `\`${field}\``).join(", ")} must be a non-empty string.`,
        { code: "VALIDATION_ERROR" }
      );
    }
  }
  buildPath(...segments) {
    return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
  }
  async request(request) {
    const response = await this.httpClient.request(
      request
    );
    return response.data;
  }
};

// src/clients/agent-client.ts
var AgentClient = class extends BaseClient {
  list(query = {}) {
    return this.request({
      method: "GET",
      path: "/v1/agents",
      query: {
        ...query
      }
    });
  }
  get(agentId) {
    return this.request({
      method: "GET",
      path: `/v1/agents/${encodePathSegment(agentId)}`
    });
  }
  create(input) {
    return this.request({
      method: "POST",
      path: "/v1/agents",
      body: input
    });
  }
  update(agentId, input) {
    return this.request({
      method: "PATCH",
      path: `/v1/agents/${encodePathSegment(agentId)}`,
      body: input
    });
  }
  delete(agentId) {
    return this.request({
      method: "DELETE",
      path: `/v1/agents/${encodePathSegment(agentId)}`
    });
  }
};

// src/validation.ts
var NON_EMPTY_STRING_PATTERN = /\S/;
var DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d+)?$/;
var STELLAR_ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;
var MAX_STELLAR_FRACTIONAL_DIGITS = 7;
var MAX_MEMO_TEXT_LENGTH = 28;
var MEMO_HEX_PATTERN = /^(?:[0-9a-fA-F]{2})*$/;
var MAX_MEMO_HEX_LENGTH = 64;
function validateNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || !NON_EMPTY_STRING_PATTERN.test(value)) {
    throw new LilyValidationError(
      `\`${fieldName}\` must be a non-empty string.`
    );
  }
}
function validateMoneyAmount(amount, context = "MoneyAmount") {
  if (!amount || typeof amount !== "object") {
    throw new LilyValidationError(`${context}: \`amount\` is required.`);
  }
  if (typeof amount.assetCode !== "string" || !STELLAR_ASSET_CODE_PATTERN.test(amount.assetCode)) {
    throw new LilyValidationError(
      `${context}: \`assetCode\` must be a 1-12 character alphanumeric Stellar asset code.`
    );
  }
  if (typeof amount.amount !== "string" || !DECIMAL_AMOUNT_PATTERN.test(amount.amount)) {
    throw new LilyValidationError(
      `${context}: \`amount\` must be a non-negative decimal string (e.g. "10.50").`
    );
  }
  const dotIndex = amount.amount.indexOf(".");
  if (dotIndex !== -1) {
    const fractionalDigits = amount.amount.length - dotIndex - 1;
    if (fractionalDigits > MAX_STELLAR_FRACTIONAL_DIGITS) {
      throw new LilyValidationError(
        `${context}: \`amount\` must have at most ${MAX_STELLAR_FRACTIONAL_DIGITS} fractional digits (Stellar limit). Got ${fractionalDigits}.`
      );
    }
  }
  if (amount.assetIssuer !== void 0) {
    if (typeof amount.assetIssuer !== "string" || !NON_EMPTY_STRING_PATTERN.test(amount.assetIssuer)) {
      throw new LilyValidationError(
        `${context}: \`assetIssuer\` must be a non-empty string when provided.`
      );
    }
  }
}
function validateMemo(memo, context = "Payment") {
  if (memo === void 0 || memo === null) {
    return;
  }
  if (typeof memo !== "string") {
    throw new LilyValidationError(
      `${context}: \`memo\` must be a string when provided.`
    );
  }
  if (MEMO_HEX_PATTERN.test(memo) && memo.length > 0) {
    if (memo.length > MAX_MEMO_HEX_LENGTH) {
      throw new LilyValidationError(
        `${context}: \`memo\` hex string must be at most ${MAX_MEMO_HEX_LENGTH} characters. Got ${memo.length}.`
      );
    }
    return;
  }
  const memoBytes = new TextEncoder().encode(memo).length;
  if (memoBytes > MAX_MEMO_TEXT_LENGTH) {
    throw new LilyValidationError(
      `${context}: \`memo\` text must be at most ${MAX_MEMO_TEXT_LENGTH} bytes (Stellar limit). Got ${memoBytes}.`
    );
  }
}
function validateResolveIdentityRequest(request) {
  const keys = [request.agentId, request.stellarAddress, request.domain].filter(
    (v) => v !== void 0 && v !== null
  );
  if (keys.length === 0) {
    throw new LilyValidationError(
      "`ResolveIdentityRequest` requires exactly one of `agentId`, `stellarAddress`, or `domain`."
    );
  }
  if (keys.length > 1) {
    throw new LilyValidationError(
      "`ResolveIdentityRequest` accepts only one resolver key at a time. Provide exactly one of `agentId`, `stellarAddress`, or `domain`."
    );
  }
  const providedKey = request.agentId !== void 0 ? "agentId" : request.stellarAddress !== void 0 ? "stellarAddress" : "domain";
  const providedValue = request[providedKey];
  if (typeof providedValue !== "string" || !NON_EMPTY_STRING_PATTERN.test(providedValue)) {
    throw new LilyValidationError(
      `\`${providedKey}\` must be a non-empty string.`
    );
  }
}
function validateExecutePaymentRequest(request) {
  validateNonEmptyString(request.fromWalletId, "fromWalletId");
  validateNonEmptyString(request.toAddress, "toAddress");
  validateMoneyAmount(request.amount, "ExecutePaymentRequest");
  validateMemo(request.memo, "ExecutePaymentRequest");
}
function validatePaymentQuoteRequest(request) {
  validateNonEmptyString(request.fromWalletId, "fromWalletId");
  validateNonEmptyString(request.toAddress, "toAddress");
  validateMoneyAmount(request.amount, "PaymentQuoteRequest");
}

// src/clients/identity-client.ts
var IdentityClient = class extends BaseClient {
  async resolve(input) {
    validateResolveIdentityRequest(input);
    return this.request({
      method: "POST",
      path: "/v1/identity/resolve",
      body: input
    });
  }
  async verify(input) {
    validateNonEmptyString(input.identityId, "identityId");
    validateNonEmptyString(input.challenge, "challenge");
    validateNonEmptyString(input.signature, "signature");
    return this.request({
      method: "POST",
      path: "/v1/identity/verify",
      body: input
    });
  }
  async get(identityId) {
    validateNonEmptyString(identityId, "identityId");
    return this.request({
      method: "GET",
      path: `/v1/identity/${encodePathSegment(identityId)}`
    });
  }
};

// src/clients/payment-client.ts
var PaymentClient = class extends BaseClient {
  async quote(input) {
    validatePaymentQuoteRequest(input);
    return this.request({
      method: "POST",
      path: "/v1/payments/quote",
      body: input
    });
  }
  async execute(input) {
    validateExecutePaymentRequest(input);
    return this.request({
      method: "POST",
      path: "/v1/payments",
      body: input
    });
  }
  get(paymentId) {
    return this.request({
      method: "GET",
      path: `/v1/payments/${encodePathSegment(paymentId)}`
    });
  }
  async list(query) {
    return this.request({
      method: "GET",
      path: "/v1/payments",
      query: query ?? {}
    });
  }
};

// src/validation/health-status.ts
var VALID_STATUSES = ["ok", "degraded", "down"];
function validateHealthStatus(data) {
  if (data === null || typeof data !== "object") {
    throw new LilyValidationError("HealthStatus must be a non-null object", {
      code: "VALIDATION_ERROR",
      details: { received: data }
    });
  }
  const obj = data;
  if (typeof obj.status !== "string") {
    throw new LilyValidationError("HealthStatus.status must be a string", {
      code: "VALIDATION_ERROR",
      details: { field: "status", received: obj.status }
    });
  }
  if (!VALID_STATUSES.includes(obj.status)) {
    throw new LilyValidationError(
      `HealthStatus.status must be one of: ${VALID_STATUSES.join(", ")}`,
      {
        code: "VALIDATION_ERROR",
        details: {
          field: "status",
          received: obj.status,
          valid: VALID_STATUSES
        }
      }
    );
  }
  if (obj.version !== void 0 && typeof obj.version !== "string") {
    throw new LilyValidationError(
      "HealthStatus.version must be a string if present",
      {
        code: "VALIDATION_ERROR",
        details: { field: "version", received: obj.version }
      }
    );
  }
  if (obj.uptime !== void 0 && typeof obj.uptime !== "number") {
    throw new LilyValidationError(
      "HealthStatus.uptime must be a number if present",
      {
        code: "VALIDATION_ERROR",
        details: { field: "uptime", received: obj.uptime }
      }
    );
  }
  return obj;
}

// src/clients/system-client.ts
var SystemClient = class extends BaseClient {
  validateResponses;
  constructor(httpClientOrConfig) {
    super(httpClientOrConfig);
    if ("validateResponses" in httpClientOrConfig) {
      this.validateResponses = httpClientOrConfig.validateResponses ?? false;
    } else {
      this.validateResponses = false;
    }
  }
  async health() {
    const data = await this.request({
      method: "GET",
      path: "/v1/system/health"
    });
    if (this.validateResponses) {
      return validateHealthStatus(data);
    }
    return data;
  }
  info() {
    return this.request({
      method: "GET",
      path: "/v1/system/info"
    });
  }
};

// src/clients/wallet-client.ts
var WalletClient = class extends BaseClient {
  provision(input) {
    return this.request({
      method: "POST",
      path: "/v1/wallets/provision",
      body: input
    });
  }
  get(walletId) {
    return this.request({
      method: "GET",
      path: `/v1/wallets/${encodePathSegment(walletId)}`
    });
  }
  list(query = {}) {
    return this.request({
      method: "GET",
      path: "/v1/wallets",
      query: {
        ...query
      }
    });
  }
};

// src/version.ts
var SDK_VERSION = "0.1.0";
var VERSION = SDK_VERSION;

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

// src/sdk.ts
var DEFAULT_API_URL = "https://api.lilyprotocol.com";
var LilySdk = class _LilySdk {
  static version = SDK_VERSION;
  config;
  httpClient;
  get http() {
    return this.httpClient;
  }
  agents;
  wallets;
  payments;
  identity;
  system;
  constructor(config, httpClient) {
    this.config = resolveLilySdkConfig(config ?? {});
    this.httpClient = httpClient ?? createFetchHttpClient(this.config);
    this.agents = new AgentClient(this.httpClient);
    this.wallets = new WalletClient(this.httpClient);
    this.payments = new PaymentClient(this.httpClient);
    this.identity = new IdentityClient(this.httpClient);
    this.system = new SystemClient(this.httpClient);
  }
  /**
   * Creates a LilySdk instance with sensible defaults from environment variables.
   * Explicit options always take precedence over environment variables.
   *
   * Env vars read:
   * - LILY_API_URL (or LILY_BASE_URL)
   * - LILY_API_KEY
   * - LILY_AUTH_TOKEN
   *
   * Throws if no baseUrl is provided and no env var is set.
   */
  static create(options, httpClient) {
    const baseUrl = options?.baseUrl ?? (typeof process !== "undefined" ? process.env.LILY_API_URL ?? process.env.LILY_BASE_URL : void 0) ?? DEFAULT_API_URL;
    if (!baseUrl) {
      throw new Error(
        "baseUrl is required. Pass it in options or set the LILY_API_URL environment variable."
      );
    }
    const apiKey = options?.apiKey ?? (typeof process !== "undefined" ? process.env.LILY_API_KEY : void 0);
    const authToken = options?.authToken ?? (typeof process !== "undefined" ? process.env.LILY_AUTH_TOKEN : void 0);
    const config = {
      baseUrl,
      ...apiKey !== void 0 ? { apiKey } : {},
      ...authToken !== void 0 ? { authToken } : {}
    };
    return new _LilySdk(config, httpClient);
  }
  /**
   * Sends a typed request using the SDK's shared HttpClient and returns the
   * parsed response data, mirroring the client method API.
   */
  async request(request) {
    const response = await this.httpClient.request(
      request
    );
    return response.data;
  }
  /**
   * Creates a new LilySdk instance with merged configuration.
   * Useful for multi-tenant scenarios where credentials or baseUrl differ per tenant.
   */
  withConfig(overrides) {
    const merged = {
      baseUrl: overrides.baseUrl ?? String(this.config.baseUrl),
      timeoutMs: overrides.timeoutMs ?? this.config.timeoutMs,
      retry: {
        ...this.config.retry,
        ...overrides.retry
      },
      defaultHeaders: {
        ...this.config.defaultHeaders,
        ...overrides.defaultHeaders
      },
      userAgent: overrides.userAgent ?? this.config.userAgent,
      fetch: overrides.fetch ?? this.config.fetch,
      ...overrides.apiKey !== void 0 ? { apiKey: overrides.apiKey } : this.config.apiKey !== void 0 ? { apiKey: this.config.apiKey } : {},
      ...overrides.authToken !== void 0 ? { authToken: overrides.authToken } : this.config.authToken !== void 0 ? { authToken: this.config.authToken } : {}
    };
    return new _LilySdk(merged);
  }
};

// src/models/common.ts
var DECIMAL_AMOUNT_PATTERN2 = /^\d+(\.\d+)?$/;
function normalizeMoneyAmount(input) {
  if (typeof input.amount !== "string" || !DECIMAL_AMOUNT_PATTERN2.test(input.amount)) {
    throw new RangeError(
      `MoneyAmount.amount must be a base-10 decimal string, got ${JSON.stringify(input.amount)}.`
    );
  }
  const [wholeRaw = "", fractionRaw = ""] = input.amount.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "");
  const fraction = fractionRaw.slice(0, 2).padEnd(2, "0");
  return { ...input, amount: `${whole}.${fraction}` };
}

exports.AgentClient = AgentClient;
exports.BaseClient = BaseClient;
exports.IdentityClient = IdentityClient;
exports.LILY_ERROR_CODES = LILY_ERROR_CODES;
exports.LilyApiError = LilyApiError;
exports.LilyAuthenticationError = LilyAuthenticationError;
exports.LilyAuthorizationError = LilyAuthorizationError;
exports.LilyConfigError = LilyConfigError;
exports.LilyConflictError = LilyConflictError;
exports.LilyNotFoundError = LilyNotFoundError;
exports.LilyRateLimitError = LilyRateLimitError;
exports.LilySdk = LilySdk;
exports.LilySdkError = LilySdkError;
exports.LilyServerError = LilyServerError;
exports.LilyTransportError = LilyTransportError;
exports.LilyValidationError = LilyValidationError;
exports.PaymentClient = PaymentClient;
exports.SDK_VERSION = SDK_VERSION;
exports.SystemClient = SystemClient;
exports.WalletClient = WalletClient;
exports.createFetchHttpClient = createFetchHttpClient;
exports.isLilySdkError = isLilySdkError;
exports.normalizeMoneyAmount = normalizeMoneyAmount;
exports.resolveLilySdkConfig = resolveLilySdkConfig;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map