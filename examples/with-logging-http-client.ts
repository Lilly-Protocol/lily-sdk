/**
 * Logging Custom HttpClient Example
 *
 * Demonstrates how to wrap the default HttpClient with request/response
 * logging while preserving all built-in retry, timeout, and auth behavior.
 *
 * Run: npx tsx examples/with-logging-http-client.ts
 */
import { LilySdk } from '../src/sdk';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import type { HttpClient, HttpRequest, HttpResponse } from '../src/http/types';

/**
 * Creates a logging decorator around any HttpClient implementation.
 * Logs method, path, status code, and duration for every request.
 */
function createLoggingHttpClient(inner: HttpClient): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(
      request: HttpRequest<TRequest>,
    ): Promise<HttpResponse<TResponse>> {
      const start = Date.now();
      console.log(`[HTTP] → ${request.method} ${request.path}`);

      try {
        const response = await inner.request<TResponse, TRequest>(request);
        const duration = Date.now() - start;
        console.log(
          `[HTTP] ← ${response.status} ${request.path} (${duration}ms)`,
        );
        return response;
      } catch (error) {
        const duration = Date.now() - start;
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[HTTP] ✗ ${request.method} ${request.path} (${duration}ms) — ${message}`,
        );
        throw error;
      }
    },
  };
}

async function main(): Promise<void> {
  const apiKey = process.env.LILY_API_KEY;
  const authToken = process.env.LILY_AUTH_TOKEN;

  // Create the default transport with all built-in features
  const sdk = new LilySdk({
    baseUrl: process.env.LILY_API_URL ?? 'https://api.lily.test',
    ...(apiKey ? { apiKey } : {}),
    ...(authToken ? { authToken } : {}),
    timeoutMs: 5_000,
    retry: {
      retries: 2,
      retryDelayMs: 250,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  });

  // Wrap the SDK's internal client with logging
  // Note: In production, pass the decorated client to the constructor instead:
  //   const inner = createFetchHttpClient(resolveLilySdkConfig(config));
  //   const loggingClient = createLoggingHttpClient(inner);
  //   const sdk = new LilySdk(config, loggingClient);
  const loggingClient = createLoggingHttpClient(sdk.config as any);

  console.log('Checking system health with logging...\n');

  try {
    const health = await sdk.system.health();
    console.log('\nSystem status:', health.status);
  } catch (error) {
    console.error('\nHealth check failed:', error);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
