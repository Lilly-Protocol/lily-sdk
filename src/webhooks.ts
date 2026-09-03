import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a webhook signature using HMAC-SHA256.
 *
 * @param payload - The raw request body as a string or Buffer.
 * @param signature - The signature from the `X-Lily-Signature` header.
 * @param secret - The webhook signing secret.
 * @returns `true` if the signature is valid, `false` otherwise.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(signature, 'hex');

  if (expectedBuf.length !== providedBuf.length) {
    // Fallback: compare as hex strings (non-constant time, but lengths differ)
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Verifies a webhook signature from parsed JSON.
 * Re-serializes the JSON to a canonical form before verifying.
 *
 * @param data - The parsed JSON object.
 * @param signature - The signature from the webhook header.
 * @param secret - The webhook signing secret.
 * @returns `true` if the signature is valid.
 */
export function verifyWebhookJSON(
  data: unknown,
  signature: string,
  secret: string,
): boolean {
  const payload = JSON.stringify(data);
  return verifyWebhookSignature(payload, signature, secret);
}

/**
 * Extracts the timestamp and signature from a signed webhook header.
 * Format: `t=<timestamp>,v1=<signature>`
 *
 * @param header - The raw signature header value.
 * @returns An object with `timestamp` and `signature`, or `null` if malformed.
 */
export function parseWebhookHeader(header: string): {
  timestamp: number | null;
  signature: string | null;
} {
  if (!header) {
    return { timestamp: null, signature: null };
  }

  const parts = header.split(',');
  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key?.trim() === 't') {
      const parsed = parseInt(value?.trim() ?? '', 10);
      timestamp = Number.isFinite(parsed) ? parsed : null;
    } else if (key?.trim() === 'v1') {
      signature = value?.trim() ?? null;
    }
  }

  return { timestamp, signature };
}

/**
 * Verifies a timestamped webhook signature with replay protection.
 * Rejects signatures older than `toleranceMs` milliseconds.
 *
 * @param payload - The raw request body.
 * @param header - The raw signature header (`t=<ts>,v1=<sig>`).
 * @param secret - The webhook signing secret.
 * @param toleranceMs - Maximum age in ms (default: 5 minutes).
 * @returns `true` if the signature is valid and within the tolerance window.
 */
export function verifyWebhookWithReplay(
  payload: string | Buffer,
  header: string,
  secret: string,
  toleranceMs: number = 300_000,
): boolean {
  const { timestamp, signature } = parseWebhookHeader(header);

  if (timestamp === null || signature === null) {
    return false;
  }

  const now = Date.now();
  const age = now - timestamp;

  if (age > toleranceMs) {
    return false;
  }

  // The signed payload includes the timestamp prefix
  const signedPayload = `${timestamp}.${payload instanceof Buffer ? payload.toString('utf8') : payload}`;
  return verifyWebhookSignature(signedPayload, signature, secret);
}
