// test/retry-exhaustion.test.ts
import { LilyApiError } from '../src/errors';
import { createHttpClient } from '../src/http/client';

describe('Retry Exhaustion', () => {
  it('should surface LilyApiError when retries are exhausted', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const client = createHttpClient({
      fetch: mockFetch,
      maxRetries: 3,
      retryDelay: 0, // No delay for testing
    });

    await expect(client.get('/test')).rejects.toBeInstanceOf(LilyApiError);
    expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });
});

// src/http/client.ts (fix implementation if needed)
import { LilyApiError } from '../errors';

export interface HttpClientOptions {
  fetch?: typeof fetch;
  maxRetries?: number;
  retryDelay?: number;
}

export function createHttpClient(options: HttpClientOptions = {}) {
  const {
    fetch: customFetch = globalThis.fetch.bind(globalThis),
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  async function request(url: string, init?: RequestInit) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await customFetch(url, init);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (2 ** attempt)));
        }
      }
    }

    throw new LilyApiError(
      `Request failed after ${maxRetries} retries`,
      lastError
    );
  }

  return {
    get: (url: string) => request(url, { method: 'GET' }),
    post: (url: string, body?: unknown) => request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  };
}