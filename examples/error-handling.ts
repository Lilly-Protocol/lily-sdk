/**
 * Error Handling and Retry Configuration Example
 *
 * Demonstrates how to configure retries in the LilySdk constructor
 * and handle typed errors using instanceof checks.
 *
 * Run: npx tsx examples/error-handling.ts
 */

import { LilySdk } from '../src/sdk';
import {
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
} from '../src/errors/sdk-error';

async function main(): Promise<void> {
  const apiKey = process.env.LILY_API_KEY;
  const authToken = process.env.LILY_AUTH_TOKEN;

  // Configure SDK with retry policy for transient failures
  const sdk = new LilySdk({
    baseUrl: process.env.LILY_API_URL ?? 'https://api.lily.test',
    ...(apiKey ? { apiKey } : {}),
    ...(authToken ? { authToken } : {}),
    timeoutMs: 5_000,
    retry: {
      retries: 3, // Up to 3 retry attempts after initial failure
      retryDelayMs: 500, // Base delay; actual delay = retryDelayMs * attempt
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  });

  try {
    console.log('Checking system health...');
    const health = await sdk.system.health();
    console.log('System status:', health.status);
  } catch (error) {
    if (error instanceof LilyAuthenticationError) {
      // Auth failures are not retried — fix credentials immediately
      console.error(`[AUTH ERROR] ${error.message}`);
      console.error(`  Status: ${error.statusCode}`);
      console.error(`  Code: ${error.code}`);
      console.error('  Action: Check your API key or auth token.');
    } else if (error instanceof LilyApiError) {
      // Server-side errors after retries exhausted
      console.error(`[API ERROR] ${error.message}`);
      console.error(`  Status: ${error.statusCode}`);
      console.error(`  Code: ${error.code}`);
      console.error(`  Details:`, error.details);
      console.error('  Action: Check server logs or retry later.');
    } else if (error instanceof LilyTransportError) {
      // Network/timeout errors after retries exhausted
      console.error(`[TRANSPORT ERROR] ${error.message}`);
      console.error(`  Code: ${error.code}`);
      if (error.cause instanceof Error) {
        console.error(`  Cause: ${error.cause.message}`);
      }
      console.error(
        '  Action: Check network connectivity or increase timeoutMs.',
      );
    } else {
      // Unexpected errors
      console.error('[UNEXPECTED ERROR]', error);
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
