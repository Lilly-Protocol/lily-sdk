/**
 * Example: error handling and retry configuration.
 * Bounty #106 — $25
 */
import { LilySdk, isLilySdkError, LilyApiError, LilyAuthenticationError } from '../src';

// SDK configured with retry settings and a mock transport
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.example',
  authToken: 'demo-token',
  retry: {
    retries: 3,
    retryDelayMs: 100,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  fetch: async () => {
    // Simulate a 500 then a success
    return new Response(JSON.stringify({ ok: true }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  },
});

async function main(): Promise<void> {
  try {
    await sdk.system.health();
  } catch (error) {
    if (isLilySdkError(error)) {
      if (error instanceof LilyApiError) {
        console.error('API error:', error.statusCode, error.code);
      } else if (error instanceof LilyAuthenticationError) {
        console.error('Auth error:', error.message);
      } else {
        console.error('SDK error:', error.code, error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}

await main();
