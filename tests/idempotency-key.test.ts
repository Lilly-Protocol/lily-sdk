import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { LilySdkConfig } from '../src/config/types';

describe('Idempotency-Key header from ExecutePaymentRequest', () => {
  it('sends Idempotency-Key header when idempotencyKey is set', async () => {
    const calls: RequestInit[] = [];
    const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push(init);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      fetch: mockFetch as any,
    };
    const resolved = resolveLilySdkConfig(config);
    const client = createFetchHttpClient(resolved);

    await client.request({
      method: 'POST',
      path: '/v1/payments',
      body: {
        fromWalletId: 'w1',
        toAddress: 'addr1',
        amount: { assetCode: 'USDC', amount: '10.00' },
        idempotencyKey: 'idem-123',
      },
      headers: { 'idempotency-key': 'idem-123' },
    });

    const headers = calls[0].headers as Record<string, string>;
    expect(headers['idempotency-key']).toBe('idem-123');
  });

  it('does not send Idempotency-Key when not provided', async () => {
    const calls: RequestInit[] = [];
    const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push(init);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const config: LilySdkConfig = {
      baseUrl: 'https://api.lily.dev',
      apiKey: 'k',
      fetch: mockFetch as any,
    };
    const resolved = resolveLilySdkConfig(config);
    const client = createFetchHttpClient(resolved);

    await client.request({
      method: 'POST',
      path: '/v1/payments',
      body: {
        fromWalletId: 'w1',
        toAddress: 'addr1',
        amount: { assetCode: 'USDC', amount: '10.00' },
      },
    });

    const headers = calls[0].headers as Record<string, string>;
    expect(headers['idempotency-key']).toBeUndefined();
  });
});
