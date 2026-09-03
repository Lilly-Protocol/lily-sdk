import { describe, it, expect } from 'vitest';
import {
  verifyWebhookSignature,
  verifyWebhookJSON,
  parseWebhookHeader,
  verifyWebhookWithReplay,
} from '../src/webhooks';
import { createHmac } from 'node:crypto';

const SECRET = 'whsec_test_secret_12345';
const PAYLOAD = '{"event":"payment.completed","data":{"id":"pm_123"}}';

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

describe('Webhook signature verification (issue #70)', () => {
  describe('verifyWebhookSignature', () => {
    it('returns true for a valid signature', () => {
      const signature = sign(PAYLOAD, SECRET);
      expect(verifyWebhookSignature(PAYLOAD, signature, SECRET)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      expect(verifyWebhookSignature(PAYLOAD, 'deadbeef', SECRET)).toBe(false);
    });

    it('returns false for wrong secret', () => {
      const signature = sign(PAYLOAD, 'wrong_secret');
      expect(verifyWebhookSignature(PAYLOAD, signature, SECRET)).toBe(false);
    });

    it('returns false for empty signature', () => {
      expect(verifyWebhookSignature(PAYLOAD, '', SECRET)).toBe(false);
    });

    it('returns false for empty secret', () => {
      const signature = sign(PAYLOAD, SECRET);
      expect(verifyWebhookSignature(PAYLOAD, signature, '')).toBe(false);
    });

    it('accepts Buffer payload', () => {
      const signature = sign(PAYLOAD, SECRET);
      expect(verifyWebhookSignature(Buffer.from(PAYLOAD), signature, SECRET)).toBe(true);
    });

    it('returns false for tampered payload', () => {
      const signature = sign(PAYLOAD, SECRET);
      expect(verifyWebhookSignature('{"event":"tampered"}', signature, SECRET)).toBe(false);
    });
  });

  describe('verifyWebhookJSON', () => {
    it('verifies parsed JSON object', () => {
      const data = { event: 'payment.completed', data: { id: 'pm_123' } };
      const payload = JSON.stringify(data);
      const signature = sign(payload, SECRET);
      expect(verifyWebhookJSON(data, signature, SECRET)).toBe(true);
    });

    it('rejects modified JSON', () => {
      const data = { event: 'payment.completed' };
      const signature = sign(JSON.stringify(data), SECRET);
      const modified = { event: 'payment.failed' };
      expect(verifyWebhookJSON(modified, signature, SECRET)).toBe(false);
    });
  });

  describe('parseWebhookHeader', () => {
    it('parses t= and v1= from header', () => {
      const header = 't=1234567890,v1=abcdef123456';
      const result = parseWebhookHeader(header);
      expect(result.timestamp).toBe(1234567890);
      expect(result.signature).toBe('abcdef123456');
    });

    it('handles empty header', () => {
      const result = parseWebhookHeader('');
      expect(result.timestamp).toBeNull();
      expect(result.signature).toBeNull();
    });

    it('handles missing v1', () => {
      const result = parseWebhookHeader('t=1234567890');
      expect(result.timestamp).toBe(1234567890);
      expect(result.signature).toBeNull();
    });

    it('handles missing t', () => {
      const result = parseWebhookHeader('v1=abcdef');
      expect(result.timestamp).toBeNull();
      expect(result.signature).toBe('abcdef');
    });

    it('handles malformed header', () => {
      const result = parseWebhookHeader('garbage');
      expect(result.timestamp).toBeNull();
      expect(result.signature).toBeNull();
    });
  });

  describe('verifyWebhookWithReplay', () => {
    it('returns true for valid recent signature', () => {
      const timestamp = Date.now();
      const signedPayload = `${timestamp}.${PAYLOAD}`;
      const signature = sign(signedPayload, SECRET);
      const header = `t=${timestamp},v1=${signature}`;
      expect(verifyWebhookWithReplay(PAYLOAD, header, SECRET)).toBe(true);
    });

    it('returns false for old timestamp', () => {
      const timestamp = Date.now() - 600_000; // 10 minutes ago
      const signedPayload = `${timestamp}.${PAYLOAD}`;
      const signature = sign(signedPayload, SECRET);
      const header = `t=${timestamp},v1=${signature}`;
      expect(verifyWebhookWithReplay(PAYLOAD, header, SECRET, 300_000)).toBe(false);
    });

    it('returns false for invalid signature', () => {
      const timestamp = Date.now();
      const header = `t=${timestamp},v1=invalid`;
      expect(verifyWebhookWithReplay(PAYLOAD, header, SECRET)).toBe(false);
    });

    it('returns false for malformed header', () => {
      expect(verifyWebhookWithReplay(PAYLOAD, 'garbage', SECRET)).toBe(false);
    });
  });
});
