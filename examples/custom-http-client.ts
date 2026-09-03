/**
 * Example: logging custom HttpClient injection.
 * Bounty #105 — $50
 */
import { LilySdk } from '../src';
import type { HttpClient, HttpRequest, HttpResponse } from '../src';

// A logging HttpClient wrapper that logs every request/response
function createLoggingHttpClient(inner: HttpClient): HttpClient {
  return {
    async request<TResponse, TRequest = unknown>(
      request: HttpRequest<TRequest>,
    ): Promise<HttpResponse<TResponse>> {
      console.log(`[HTTP] ${request.method} ${request.path}`);
      const start = performance.now();
      try {
        const response = await inner.request<TResponse, TRequest>(request);
        console.log(`[HTTP] ${request.method} ${request.path} → ${response.status} (${Math.round(performance.now() - start)}ms)`);
        return response;
      } catch (error) {
        console.error(`[HTTP] ${request.method} ${request.path} → ERROR (${Math.round(performance.now() - start)}ms)`);
        throw error;
      }
    },
  };
}

// A mock inner client
const mockClient: HttpClient = {
  async request<TResponse>(): Promise<HttpResponse<TResponse>> {
    return {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      data: { status: 'ok' } as TResponse,
    };
  },
};

const sdk = new LilySdk(
  {
    baseUrl: 'https://api.lily.example',
    authToken: 'demo-token',
  },
  createLoggingHttpClient(mockClient),
);

async function main(): Promise<void> {
  const health = await sdk.system.health();
  console.log('Health:', health.status);
}

await main();
