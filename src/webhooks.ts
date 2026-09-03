import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Recursively sorts object keys for canonical JSON serialization.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Verifies a webhook signature using HMAC-SHA256.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Verifies a webhook signature from parsed JSON.
 * Re-serializes the JSON to a canonical form (sorted keys) before verifying.
 */
export function verifyWebhookJSON(
  data: unknown,
  signature: string,
  secret: string,
): boolean {
  const payload = JSON.stringify(canonicalize(data));
  return verifyWebhookSignature(payload, signature, secret);
}

/**
 * Extracts the timestamp and signature from a signed webhook header.
 * Format: t=<timestamp>,v1=<signature>
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
  const signedPayload = `${timestamp}.${payload instanceof Buffer ? payload.toString('utf8') : payload}`;
  return verifyWebhookSignature(signedPayload, signature, secret);
}
