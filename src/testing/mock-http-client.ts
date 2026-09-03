import type {
  HttpClient,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  HttpResponse,
} from '../http/types';

/**
 * A recorded HTTP request captured by MockHttpClient.
 */
export interface RecordedHttpRequest<TBody = unknown> {
  method: HttpMethod;
  path: string;
  headers: HttpHeaders;
  query?: Record<
    string,
    string | number | boolean | (string | number)[] | undefined
  >;
  body?: TBody;
  timeoutMs?: number;
  signal?: AbortSignal;
  timestamp: number;
}

/**
 * Handler function to dynamically produce an HttpResponse for a given request.
 */
export type MockHttpHandler = (
  request: HttpRequest<unknown>,
) => HttpResponse<unknown> | Promise<HttpResponse<unknown>>;

/**
 * Hook invoked on every request for assertions or spying.
 */
export type MockAssertionHook = (
  request: RecordedHttpRequest<unknown>,
) => void | Promise<void>;

/**
 * Matcher criteria to match requests against stubs or in assertions.
 */
export interface MockRequestMatcher {
  /** Expected HTTP method (e.g. 'GET', 'POST'). Case-insensitive. */
  method?: HttpMethod | string;
  /** Expected path string or RegExp (e.g. '/v1/agents' or /\/v1\/agents\/.+/). */
  path?: string | RegExp;
  /** Expected headers. Values can be string or RegExp. Compared case-insensitively. */
  headers?: Record<string, string | RegExp>;
  /** Expected query parameters. */
  query?: Record<
    string,
    string | number | boolean | (string | number)[] | undefined
  >;
  /** Expected body. Deep equality comparison, or custom predicate function. */
  body?: unknown | ((body: unknown) => boolean | void);
}

/**
 * A canned response specification or raw data.
 */
export type MockStubResponse<T = unknown> =
  | HttpResponse<T>
  | {
      status?: number;
      data?: T;
      headers?: Headers | Record<string, string>;
      attempts?: number;
      retried?: boolean;
    }
  | T;

/**
 * A registered response stub.
 */
export interface MockResponseStub {
  matcher?:
    | MockRequestMatcher
    | string
    | RegExp
    | ((req: HttpRequest<unknown>) => boolean)
    | undefined;
  response?: MockStubResponse | undefined;
  handler?: MockHttpHandler | undefined;
  /** If true, this stub is removed after being used once. */
  once?: boolean | undefined;
}

/**
 * Options for configuring a MockHttpClient.
 */
export interface MockHttpClientOptions {
  /** Default response when no stub or handler matches. */
  defaultResponse?: MockStubResponse | undefined;
  /** Default response data when no stub or handler matches. */
  defaultData?: unknown;
  /** Dynamic handler function. */
  handler?: MockHttpHandler | undefined;
  /** Assertion hook called on every request with the recorded request. */
  onRequest?: MockAssertionHook | undefined;
  /** Initial response stubs. */
  stubs?: MockResponseStub[] | undefined;
  /** Whether to record requests (default: true). */
  recordRequests?: boolean | undefined;
}

/**
 * Internal deep equality helper for matcher validation.
 */
function deepEqual(actual: unknown, expected: unknown): boolean {
  if (expected === actual || Object.is(actual, expected)) {
    return true;
  }

  if (typeof expected === 'function') {
    try {
      const result = expected(actual);
      return result !== false;
    } catch {
      return false;
    }
  }

  if (expected instanceof RegExp) {
    return typeof actual === 'string' ? expected.test(actual) : false;
  }

  if (expected instanceof Date) {
    return actual instanceof Date && expected.getTime() === actual.getTime();
  }

  if (
    typeof expected !== 'object' ||
    expected === null ||
    typeof actual !== 'object' ||
    actual === null
  ) {
    return false;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || expected.length !== actual.length) {
      return false;
    }
    for (let i = 0; i < expected.length; i++) {
      if (!deepEqual(actual[i], expected[i])) {
        return false;
      }
    }
    return true;
  }

  if (Array.isArray(actual)) {
    return false;
  }

  const expectedKeys = Object.keys(expected);
  for (const key of expectedKeys) {
    if (!Object.prototype.hasOwnProperty.call(actual, key)) {
      return false;
    }
    if (
      !deepEqual(
        (actual as Record<string, unknown>)[key],
        (expected as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Helper to match an HttpRequest against a MockRequestMatcher or predicate.
 */
function matchesRequest(
  request: HttpRequest<unknown>,
  matcher?:
    | MockRequestMatcher
    | string
    | RegExp
    | ((req: HttpRequest<unknown>) => boolean),
): boolean {
  if (!matcher) {
    return true;
  }

  if (typeof matcher === 'function') {
    return Boolean(matcher(request));
  }

  if (typeof matcher === 'string') {
    return request.path === matcher;
  }

  if (matcher instanceof RegExp) {
    return matcher.test(request.path);
  }

  if (matcher.method) {
    if (request.method.toUpperCase() !== matcher.method.toUpperCase()) {
      return false;
    }
  }

  if (matcher.path) {
    if (matcher.path instanceof RegExp) {
      if (!matcher.path.test(request.path)) {
        return false;
      }
    } else if (request.path !== matcher.path) {
      return false;
    }
  }

  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    const lowerReqHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(reqHeaders)) {
      lowerReqHeaders[k.toLowerCase()] = String(v);
    }

    for (const [key, expectedVal] of Object.entries(matcher.headers)) {
      const actualVal = lowerReqHeaders[key.toLowerCase()];
      if (actualVal === undefined) {
        return false;
      }
      if (expectedVal instanceof RegExp) {
        if (!expectedVal.test(actualVal)) {
          return false;
        }
      } else if (String(expectedVal) !== actualVal) {
        return false;
      }
    }
  }

  if (matcher.query) {
    const reqQuery = request.query ?? {};
    for (const [key, expectedVal] of Object.entries(matcher.query)) {
      const actualVal = reqQuery[key];
      if (!deepEqual(actualVal, expectedVal)) {
        return false;
      }
    }
  }

  if (matcher.body !== undefined) {
    if (!deepEqual(request.body, matcher.body)) {
      return false;
    }
  }

  return true;
}

/**
 * Formats raw canned data or partial response into a full HttpResponse.
 */
function formatResponse<T>(
  raw: MockStubResponse<T> | undefined,
  defaultData: unknown = {},
): HttpResponse<T> {
  if (raw === undefined) {
    return {
      status: 200,
      headers: new Headers(),
      data: defaultData as T,
      attempts: 1,
      retried: false,
    };
  }

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'status' in raw &&
    typeof (raw as { status?: unknown }).status === 'number'
  ) {
    const obj = raw as {
      status: number;
      data?: T;
      headers?: Headers | Record<string, string>;
      attempts?: number;
      retried?: boolean;
    };
    const headers =
      obj.headers instanceof Headers
        ? obj.headers
        : new Headers(obj.headers as Record<string, string> | undefined);

    return {
      status: obj.status,
      headers,
      data: ('data' in obj ? obj.data : ({} as T)) as T,
      attempts: obj.attempts ?? 1,
      retried: obj.retried ?? false,
    };
  }

  return {
    status: 200,
    headers: new Headers(),
    data: raw as T,
    attempts: 1,
    retried: false,
  };
}

/**
 * In-memory, scriptable implementation of HttpClient designed for unit testing.
 *
 * Supports:
 * - Returning canned responses
 * - Per-request response stubs with fluent matching
 * - Queued sequential responses
 * - Full request recording (method, path, headers, query, body)
 * - Assertion hooks and built-in assertion helpers
 */
export class MockHttpClient implements HttpClient {
  public readonly requests: RecordedHttpRequest<unknown>[] = [];

  private _defaultResponse?: MockStubResponse | undefined;
  private _defaultData?: unknown;
  private _handler?: MockHttpHandler | undefined;
  private _assertionHook?: MockAssertionHook | undefined;
  private _stubs: MockResponseStub[] = [];
  private _responseQueue: (MockStubResponse | MockHttpHandler)[] = [];
  private _recordRequests: boolean = true;

  /**
   * Access the list of recorded requests (alias for `.requests`).
   */
  public get calls(): RecordedHttpRequest<unknown>[] {
    return this.requests;
  }

  /**
   * The most recently recorded request, or undefined if no requests have been made.
   */
  public get lastRequest(): RecordedHttpRequest<unknown> | undefined {
    return this.requests[this.requests.length - 1];
  }

  public constructor(
    handlerOrOptionsOrData?:
      | MockHttpHandler
      | MockHttpClientOptions
      | MockStubResponse,
  ) {
    if (typeof handlerOrOptionsOrData === 'function') {
      this._handler = handlerOrOptionsOrData as MockHttpHandler;
    } else if (
      handlerOrOptionsOrData !== null &&
      typeof handlerOrOptionsOrData === 'object'
    ) {
      const isOptions =
        'handler' in handlerOrOptionsOrData ||
        'stubs' in handlerOrOptionsOrData ||
        'onRequest' in handlerOrOptionsOrData ||
        'recordRequests' in handlerOrOptionsOrData ||
        'defaultResponse' in handlerOrOptionsOrData ||
        'defaultData' in handlerOrOptionsOrData;

      if (isOptions) {
        const opts = handlerOrOptionsOrData as MockHttpClientOptions;
        if (opts.handler !== undefined) this._handler = opts.handler;
        if (opts.onRequest !== undefined) this._assertionHook = opts.onRequest;
        if (opts.defaultResponse !== undefined)
          this._defaultResponse = opts.defaultResponse;
        if (opts.defaultData !== undefined)
          this._defaultData = opts.defaultData;
        this._recordRequests = opts.recordRequests ?? true;
        if (opts.stubs) {
          this._stubs = [...opts.stubs];
        }
      } else {
        this._defaultResponse = handlerOrOptionsOrData;
      }
    } else if (handlerOrOptionsOrData !== undefined) {
      this._defaultResponse = handlerOrOptionsOrData;
    }
  }

  /**
   * Handle an incoming HttpRequest, record it, and return the resolved HttpResponse.
   */
  public async request<TResponse, TRequest = unknown>(
    request: HttpRequest<TRequest>,
  ): Promise<HttpResponse<TResponse>> {
    const recorded: RecordedHttpRequest<TRequest> = {
      method: request.method,
      path: request.path,
      headers: { ...(request.headers ?? {}) },
      ...(request.query !== undefined ? { query: { ...request.query } } : {}),
      ...(request.body !== undefined ? { body: request.body } : {}),
      ...(request.timeoutMs !== undefined
        ? { timeoutMs: request.timeoutMs }
        : {}),
      ...(request.signal !== undefined ? { signal: request.signal } : {}),
      timestamp: Date.now(),
    };

    if (this._recordRequests) {
      this.requests.push(recorded);
    }

    if (this._assertionHook) {
      await this._assertionHook(recorded);
    }

    // 1. Check queued responses (FIFO)
    if (this._responseQueue.length > 0) {
      const next = this._responseQueue.shift()!;
      if (typeof next === 'function') {
        const res = await next(request);
        return formatResponse<TResponse>(res, this._defaultData);
      }
      return formatResponse<TResponse>(next, this._defaultData);
    }

    // 2. Check registered stubs in registration order
    for (let i = 0; i < this._stubs.length; i++) {
      const stub = this._stubs[i]!;
      if (matchesRequest(request, stub.matcher)) {
        if (stub.once) {
          this._stubs.splice(i, 1);
        }
        if (stub.handler) {
          const res = await stub.handler(request);
          return formatResponse<TResponse>(res, this._defaultData);
        }
        return formatResponse<TResponse>(
          stub.response as MockStubResponse<TResponse>,
          this._defaultData,
        );
      }
    }

    // 3. Check custom handler
    if (this._handler) {
      const res = await this._handler(request);
      return formatResponse<TResponse>(res, this._defaultData);
    }

    // 4. Default response
    return formatResponse<TResponse>(
      this._defaultResponse as MockStubResponse<TResponse>,
      this._defaultData,
    );
  }

  /**
   * Registers a response stub for requests matching the given criteria.
   */
  public stub(
    matcher:
      | MockRequestMatcher
      | string
      | RegExp
      | ((req: HttpRequest<unknown>) => boolean),
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    const stubObj: MockResponseStub = {
      matcher,
      ...(typeof responseOrHandler === 'function'
        ? { handler: responseOrHandler as MockHttpHandler }
        : { response: responseOrHandler }),
      ...(options?.once !== undefined ? { once: options.once } : {}),
    };
    this._stubs.push(stubObj);
    return this;
  }

  /**
   * Registers a response stub for a specific HTTP method and path.
   */
  public on(
    method: HttpMethod,
    path: string | RegExp,
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    return this.stub({ method, path }, responseOrHandler, options);
  }

  /**
   * Registers a response stub for GET requests matching the path.
   */
  public onGet(
    path: string | RegExp,
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    return this.on('GET', path, responseOrHandler, options);
  }

  /**
   * Registers a response stub for POST requests matching the path.
   */
  public onPost(
    path: string | RegExp,
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    return this.on('POST', path, responseOrHandler, options);
  }

  /**
   * Registers a response stub for PUT requests matching the path.
   */
  public onPut(
    path: string | RegExp,
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    return this.on('PUT', path, responseOrHandler, options);
  }

  /**
   * Registers a response stub for PATCH requests matching the path.
   */
  public onPatch(
    path: string | RegExp,
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    return this.on('PATCH', path, responseOrHandler, options);
  }

  /**
   * Registers a response stub for DELETE requests matching the path.
   */
  public onDelete(
    path: string | RegExp,
    responseOrHandler: MockStubResponse | MockHttpHandler,
    options?: { once?: boolean },
  ): this {
    return this.on('DELETE', path, responseOrHandler, options);
  }

  /**
   * Enqueues a response or handler to be returned for the next request in FIFO order.
   */
  public queueResponse(
    responseOrHandler: MockStubResponse | MockHttpHandler,
  ): this {
    this._responseQueue.push(responseOrHandler);
    return this;
  }

  /**
   * Enqueues multiple responses to be returned in sequential order.
   */
  public queueResponses(
    ...responses: (MockStubResponse | MockHttpHandler)[]
  ): this {
    this._responseQueue.push(...responses);
    return this;
  }

  /**
   * Sets or updates the fallback default response.
   */
  public setDefaultResponse(response: MockStubResponse): this {
    this._defaultResponse = response;
    return this;
  }

  /**
   * Sets or updates the fallback dynamic request handler.
   */
  public setHandler(handler: MockHttpHandler): this {
    this._handler = handler;
    return this;
  }

  /**
   * Registers an assertion hook called on every request.
   */
  public onRequest(hook: MockAssertionHook): this {
    this._assertionHook = hook;
    return this;
  }

  /**
   * Alias for `onRequest` for asserting or spying on recorded requests.
   */
  public onAssert(hook: MockAssertionHook): this {
    return this.onRequest(hook);
  }

  /**
   * Clears all recorded requests. Stubs and queued responses are preserved.
   */
  public clear(): void {
    this.requests.length = 0;
  }

  /**
   * Resets the client, clearing all recorded requests, stubs, queued responses, and hooks.
   */
  public reset(): void {
    this.requests.length = 0;
    this._stubs = [];
    this._responseQueue = [];
    this._assertionHook = undefined;
  }

  /**
   * Asserts that the client was called a specific number of times (or at least once if omitted).
   */
  public assertCalled(times?: number): void {
    if (times !== undefined) {
      if (this.requests.length !== times) {
        throw new Error(
          `Expected MockHttpClient to be called ${times} time(s), but was called ${this.requests.length} time(s).`,
        );
      }
    } else if (this.requests.length === 0) {
      throw new Error(
        'Expected MockHttpClient to be called at least once, but it was never called.',
      );
    }
  }

  /**
   * Asserts that no requests were made to this client.
   */
  public assertNotCalled(): void {
    if (this.requests.length !== 0) {
      throw new Error(
        `Expected MockHttpClient not to be called, but received ${this.requests.length} request(s).`,
      );
    }
  }

  /**
   * Asserts that the request at the given index matches the expected criteria.
   * Defaults to the most recent request (index = -1).
   */
  public assertRequest(
    matcher: MockRequestMatcher,
    index: number = -1,
  ): RecordedHttpRequest {
    const resolvedIndex = index < 0 ? this.requests.length + index : index;

    if (
      resolvedIndex < 0 ||
      resolvedIndex >= this.requests.length ||
      this.requests.length === 0
    ) {
      throw new Error(
        `Expected request at index ${index}, but only ${this.requests.length} request(s) were recorded.`,
      );
    }

    const req = this.requests[resolvedIndex]!;

    if (matcher.method) {
      if (req.method.toUpperCase() !== matcher.method.toUpperCase()) {
        throw new Error(
          `Expected request[${resolvedIndex}].method to be "${matcher.method.toUpperCase()}", but received "${req.method}".`,
        );
      }
    }

    if (matcher.path) {
      if (matcher.path instanceof RegExp) {
        if (!matcher.path.test(req.path)) {
          throw new Error(
            `Expected request[${resolvedIndex}].path to match ${matcher.path}, but received "${req.path}".`,
          );
        }
      } else if (req.path !== matcher.path) {
        throw new Error(
          `Expected request[${resolvedIndex}].path to be "${matcher.path}", but received "${req.path}".`,
        );
      }
    }

    if (matcher.headers) {
      const lowerHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        lowerHeaders[k.toLowerCase()] = String(v);
      }

      for (const [key, expectedVal] of Object.entries(matcher.headers)) {
        const actualVal = lowerHeaders[key.toLowerCase()];
        if (actualVal === undefined) {
          throw new Error(
            `Expected request[${resolvedIndex}].headers to include header "${key}", but it was not present.`,
          );
        }
        if (expectedVal instanceof RegExp) {
          if (!expectedVal.test(actualVal)) {
            throw new Error(
              `Expected request[${resolvedIndex}].headers["${key}"] to match ${expectedVal}, but received "${actualVal}".`,
            );
          }
        } else if (String(expectedVal) !== actualVal) {
          throw new Error(
            `Expected request[${resolvedIndex}].headers["${key}"] to be "${expectedVal}", but received "${actualVal}".`,
          );
        }
      }
    }

    if (matcher.query) {
      const reqQuery = req.query ?? {};
      for (const [key, expectedVal] of Object.entries(matcher.query)) {
        const actualVal = reqQuery[key];
        if (!deepEqual(actualVal, expectedVal)) {
          throw new Error(
            `Expected request[${resolvedIndex}].query["${key}"] to match ${JSON.stringify(expectedVal)}, but received ${JSON.stringify(actualVal)}.`,
          );
        }
      }
    }

    if (matcher.body !== undefined) {
      if (typeof matcher.body === 'function') {
        try {
          const result = matcher.body(req.body);
          if (result === false) {
            throw new Error('Predicate returned false.');
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(
            `Expected request[${resolvedIndex}].body to satisfy predicate: ${msg}`,
          );
        }
      } else if (!deepEqual(req.body, matcher.body)) {
        throw new Error(
          `Expected request[${resolvedIndex}].body to equal ${JSON.stringify(matcher.body)}, but received ${JSON.stringify(req.body)}.`,
        );
      }
    }

    return req;
  }

  /**
   * Asserts that the most recent request matches the expected criteria.
   */
  public assertLastRequest(matcher: MockRequestMatcher): RecordedHttpRequest {
    return this.assertRequest(matcher, -1);
  }

  /**
   * Asserts that at least one recorded request matches the given criteria.
   */
  public assertCalledWith(matcher: MockRequestMatcher): RecordedHttpRequest {
    for (let i = 0; i < this.requests.length; i++) {
      try {
        return this.assertRequest(matcher, i);
      } catch {
        // Try next request
      }
    }

    throw new Error(
      `Expected at least one request matching criteria, but none of the ${this.requests.length} recorded request(s) matched.`,
    );
  }
}

/**
 * Creates a lightweight, dependency-free in-memory HttpClient for unit tests.
 *
 * @param handlerOrOptionsOrData Optional handler function, options object, or default response data.
 * @returns A scriptable MockHttpClient instance.
 *
 * @example
 * ```typescript
 * import { createMockHttpClient } from '@lily-protocol/sdk/testing';
 *
 * const mock = createMockHttpClient();
 * mock.onGet('/v1/system/health', { status: 'healthy' });
 *
 * const sdk = new LilySdk({ baseUrl: 'https://api.lily.test' }, mock);
 * const health = await sdk.system.health();
 *
 * mock.assertLastRequest({
 *   method: 'GET',
 *   path: '/v1/system/health',
 * });
 * ```
 */
export function createMockHttpClient(
  handlerOrOptionsOrData?:
    | MockHttpHandler
    | MockHttpClientOptions
    | MockStubResponse,
): MockHttpClient {
  return new MockHttpClient(handlerOrOptionsOrData);
}
