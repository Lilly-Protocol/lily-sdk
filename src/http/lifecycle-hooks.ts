import type { HttpResponse, HttpRequest } from './types';

/**
 * Lifecycle hooks for the HTTP transport.
 * Called at specific points during request processing.
 */
export interface RequestLifecycleHooks {
  /**
   * Called before the request is sent.
   * Receives the resolved request object.
   */
  beforeRequest?: (request: HttpRequest) => void | Promise<void>;

  /**
   * Called after a successful response (2xx).
   * Receives the request and the response.
   */
  afterResponse?: (request: HttpRequest, response: HttpResponse) => void | Promise<void>;

  /**
   * Called when an error occurs (non-2xx or network error).
   * Receives the request and the error.
   */
  onError?: (request: HttpRequest, error: Error) => void | Promise<void>;

  /**
   * Called when a retry is scheduled.
   * Receives the request, attempt number, and delay in ms.
   */
  onRetry?: (request: HttpRequest, attempt: number, delayMs: number) => void | Promise<void>;
}

/**
 * Composes multiple lifecycle hook sets into one.
 * Hooks are called in order. Errors in hooks are swallowed
 * to prevent them from disrupting the request flow.
 */
export function composeHooks(...hookSets: RequestLifecycleHooks[]): RequestLifecycleHooks {
  return {
    async beforeRequest(request: HttpRequest) {
      for (const hooks of hookSets) {
        try {
          await hooks.beforeRequest?.(request);
        } catch {
          // Swallow hook errors
        }
      }
    },
    async afterResponse(request: HttpRequest, response: HttpResponse) {
      for (const hooks of hookSets) {
        try {
          await hooks.afterResponse?.(request, response);
        } catch {
          // Swallow hook errors
        }
      }
    },
    async onError(request: HttpRequest, error: Error) {
      for (const hooks of hookSets) {
        try {
          await hooks.onError?.(request, error);
        } catch {
          // Swallow hook errors
        }
      }
    },
    async onRetry(request: HttpRequest, attempt: number, delayMs: number) {
      for (const hooks of hookSets) {
        try {
          await hooks.onRetry?.(request, attempt, delayMs);
        } catch {
          // Swallow hook errors
        }
      }
    },
  };
}
