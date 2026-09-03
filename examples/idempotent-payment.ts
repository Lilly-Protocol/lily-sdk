/**
 * Idempotent Payment Execution with Retries
 *
 * Demonstrates the safe pattern for executing payments that may be retried
 * on transient failures without risk of double-charging:
 *
 *   1. Generate a unique idempotency key per logical payment
 *   2. Pass the same key on every retry attempt
 *   3. The server deduplicates by key, so retries are safe
 *
 * Run: npx tsx examples/idempotent-payment.ts
 */
import { randomUUID } from 'node:crypto';
import { LilySdk } from '../src/sdk';
import { LilyApiError, LilyTransportError } from '../src/errors/sdk-error';

/** Maximum number of retry attempts for transient failures. */
const MAX_RETRIES = 3;

/** Base delay in ms between retries (exponential backoff). */
const BASE_RETRY_DELAY_MS = 500;

async function main(): Promise<void> {
  const apiKey = process.env.LILY_API_KEY;
  const authToken = process.env.LILY_AUTH_TOKEN;

  const sdk = new LilySdk({
    baseUrl: process.env.LILY_API_URL ?? 'https://api.lily.test',
    ...(apiKey ? { apiKey } : {}),
    ...(authToken ? { authToken } : {}),
    timeoutMs: 10_000,
    retry: {
      retries: 0, // We handle retries manually to preserve the idempotency key
      retryDelayMs: 0,
      retryableStatusCodes: [],
    },
  });

  // ── Step 1: Generate a unique key for THIS logical payment ──────────
  // Use a UUID, a business-reference slug, or any value that is unique
  // per distinct payment intent. Reuse the SAME key across retries.
  const idempotencyKey = `pay-${randomUUID()}`;
  console.log(`Idempotency key: ${idempotencyKey}`);

  // ── Step 2: Execute with manual retry loop ─────────────────────────
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`  Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      console.log(`Attempt ${attempt + 1}: executing payment...`);

      const payment = await sdk.payments.execute({
        fromWalletId: 'wallet-stellar-main',
        toAddress: 'GABC...DESTINATION',
        amount: { assetCode: 'USDC', amount: '25.00' },
        memo: 'Invoice #INV-2026-0842',
        idempotencyKey, // ← Same key on every attempt
      });

      console.log(`✅ Payment executed successfully!`);
      console.log(`   ID: ${payment.id}`);
      console.log(`   Status: ${payment.status}`);
      return; // Success — exit the retry loop
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof LilyApiError) {
        // Server-side errors (5xx) are safe to retry with the same key.
        // The server will return the original response if it already processed
        // this idempotency key, preventing double-charges.
        if ((error.statusCode ?? 0) >= 500) {
          console.log(
            `  ⚠️  Server error ${error.statusCode}: ${error.message}`,
          );
          continue;
        }
        // Client errors (4xx except 429) are NOT retryable — fix the request.
        console.error(`❌ Client error ${error.statusCode}: ${error.message}`);
        throw error;
      }

      if (error instanceof LilyTransportError) {
        // Network timeouts and connection errors are always safe to retry.
        // The server either never received the request (safe to resend) or
        // already processed it (will deduplicate by idempotency key).
        console.log(`  ⚠️  Transport error: ${error.message}`);
        continue;
      }

      // Unexpected errors — do not retry.
      throw error;
    }
  }

  // All retries exhausted
  console.error(`❌ Payment failed after ${MAX_RETRIES + 1} attempts.`);
  throw lastError;
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
