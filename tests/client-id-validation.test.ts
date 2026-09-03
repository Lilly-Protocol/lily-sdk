import { describe, expect, it, vi } from 'vitest';

import { AgentClient } from '../src/clients/agent-client';
import { PaymentClient } from '../src/clients/payment-client';
import { WalletClient } from '../src/clients/wallet-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient } from '../src/http/types';

/**
 * Issue #443: path-id methods must reject empty and whitespace-only ids with
 * a LilyValidationError before any HTTP request is issued.
 */
describe('client path-id validation (issue #443)', () => {
  function makeSpyHttpClient(): HttpClient & {
    request: ReturnType<typeof vi.fn>;
  } {
    return {
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        data: {},
        attempts: 1,
        retried: false,
      }),
    } as HttpClient & { request: ReturnType<typeof vi.fn> };
  }

  describe('AgentClient', () => {
    it('rejects an empty agentId in get() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new AgentClient(http);

      await expect(client.get('')).rejects.toBeInstanceOf(LilyValidationError);
      expect(http.request).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only agentId in update() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new AgentClient(http);

      await expect(client.update('   ', {})).rejects.toBeInstanceOf(
        LilyValidationError,
      );
      expect(http.request).not.toHaveBeenCalled();
    });

    it('rejects an empty agentId in delete() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new AgentClient(http);

      await expect(client.delete('')).rejects.toBeInstanceOf(
        LilyValidationError,
      );
      expect(http.request).not.toHaveBeenCalled();
    });

    it('still issues requests for non-empty ids', async () => {
      const http = makeSpyHttpClient();
      const client = new AgentClient(http);

      await client.get('agent-123');

      expect(http.request).toHaveBeenCalledTimes(1);
      expect(http.request.mock.calls[0]![0].path).toBe('/v1/agents/agent-123');
    });
  });

  describe('WalletClient', () => {
    it('rejects an empty walletId in get() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new WalletClient(http);

      await expect(client.get('')).rejects.toBeInstanceOf(LilyValidationError);
      expect(http.request).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only walletId in get() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new WalletClient(http);

      await expect(client.get('  \t ')).rejects.toBeInstanceOf(
        LilyValidationError,
      );
      expect(http.request).not.toHaveBeenCalled();
    });

    it('still issues requests for non-empty ids', async () => {
      const http = makeSpyHttpClient();
      const client = new WalletClient(http);

      await client.get('wallet-456');

      expect(http.request).toHaveBeenCalledTimes(1);
      expect(http.request.mock.calls[0]![0].path).toBe(
        '/v1/wallets/wallet-456',
      );
    });
  });

  describe('PaymentClient', () => {
    it('rejects an empty paymentId in get() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new PaymentClient(http);

      await expect(client.get('')).rejects.toBeInstanceOf(LilyValidationError);
      expect(http.request).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only paymentId in get() without calling the client', async () => {
      const http = makeSpyHttpClient();
      const client = new PaymentClient(http);

      await expect(client.get('   ')).rejects.toBeInstanceOf(
        LilyValidationError,
      );
      expect(http.request).not.toHaveBeenCalled();
    });

    it('still issues requests for non-empty ids', async () => {
      const http = makeSpyHttpClient();
      const client = new PaymentClient(http);

      await client.get('payment-789');

      expect(http.request).toHaveBeenCalledTimes(1);
      expect(http.request.mock.calls[0]![0].path).toBe(
        '/v1/payments/payment-789',
      );
    });
  });
});
