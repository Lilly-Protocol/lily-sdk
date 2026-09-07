import { describe, it, expect, vi } from 'vitest';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { resolveLilySdkConfig } from '../src/config/resolve-config';
import type { MoneyAmount } from '../src/models/common';

describe('MoneyAmount decimal normalization passthrough', () => {
  function captureBody() {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const config = resolveLilySdkConfig({
      baseUrl: 'https://api.example.com',
      fetch: mockFetch as typeof fetch,
    });

    const client = createFetchHttpClient(config);
    return { client, mockFetch };
  }

  async function sendQuote(amount: MoneyAmount) {
    const { client, mockFetch } = captureBody();
    await client.request({
      method: 'POST',
      path: '/v1/payments/quote',
      body: {
        fromWalletId: 'wallet_1',
        toAddress: 'addr_1',
        amount,
      },
    });

    const call = mockFetch.mock.calls[0];
    if (!call) throw new Error('fetch not called');
    const init = call[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    return body.amount as MoneyAmount;
  }

  it('passes integer string unchanged', async () => {
    const result = await sendQuote({ assetCode: 'USDC', amount: '1' });
    expect(result.amount).toBe('1');
  });

  it('passes decimal with trailing zero unchanged', async () => {
    const result = await sendQuote({ assetCode: 'USDC', amount: '1.0' });
    expect(result.amount).toBe('1.0');
  });

  it('passes leading-zero decimal unchanged', async () => {
    const result = await sendQuote({ assetCode: 'USDC', amount: '01.5' });
    expect(result.amount).toBe('01.5');
  });

  it('passes micro-decimal unchanged', async () => {
    const result = await sendQuote({ assetCode: 'USDC', amount: '0.000001' });
    expect(result.amount).toBe('0.000001');
  });
});
