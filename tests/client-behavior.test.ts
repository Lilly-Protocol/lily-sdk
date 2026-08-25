import { describe, expect, it, vi } from 'vitest';

import { LilyAuthenticationError, LilyValidationError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('client behavior', () => {
  it('calls system health endpoint through the system client', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          status: 'ok',
          version: '0.1.0',
          timestamp: new Date().toISOString(),
          checks: {
            api: 'ok',
          },
        },
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(requestSpy),
    );

    const health = await sdk.system.health();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/system/health',
    });
    expect(health.status).toBe('ok');
  });

  it('adds auth headers to transport requests', async () => {
    const fetchSpy = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        authorization: 'Bearer secret-token',
        'x-api-key': 'secret-key',
      });

      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'ok',
            version: '0.1.0',
            timestamp: new Date().toISOString(),
            checks: {
              api: 'ok',
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      );
    });

    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      apiKey: 'secret-key',
      authToken: 'secret-token',
      timeoutMs: 2_000,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: fetchSpy,
    });

    const response = await httpClient.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('maps authentication failures to a typed error', async () => {
    const httpClient = createFetchHttpClient({
      baseUrl: new URL('https://api.lily.test/'),
      timeoutMs: 2_000,
      retry: {
        retries: 0,
        retryDelayMs: 0,
        retryableStatusCodes: [],
      },
      defaultHeaders: {},
      userAgent: 'lily-sdk/test',
      fetch: vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'nope' }), {
            status: 401,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
      ),
    });

    await expect(
      httpClient.request({
        method: 'GET',
        path: '/v1/system/health',
      }),
    ).rejects.toBeInstanceOf(LilyAuthenticationError);
  });
});

describe('payment input validation', () => {
  const quoteOk = {
    amount: { assetCode: 'USDC', amount: '10.00' },
    estimatedFee: { assetCode: 'XLM', amount: '0.00001' },
    expiresAt: '2026-01-01T00:00:00.000Z',
  };

  const paymentOk = {
    id: 'pay_1',
    fromWalletId: 'wallet_123',
    toAddress: 'GBEXAMPLE',
    amount: { assetCode: 'USDC', amount: '10.00' },
    status: 'queued',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  function sdkWithSpy(requestSpy: ReturnType<typeof vi.fn>) {
    return new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      createMockHttpClient(requestSpy),
    );
  }

  function resolveSpy(data: unknown) {
    return vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data,
      }),
    );
  }

  it('forwards valid quote and execute bodies unchanged', async () => {
    const requestSpy = resolveSpy(quoteOk);
    const sdk = sdkWithSpy(requestSpy);
    const quoteInput = {
      fromWalletId: 'wallet_123',
      toAddress: 'GBEXAMPLE',
      amount: { assetCode: 'USDC', amount: '0' },
    };

    await sdk.payments.quote(quoteInput);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/payments/quote',
      body: quoteInput,
    });

    const executeSpy = resolveSpy(paymentOk);
    const executeSdk = sdkWithSpy(executeSpy);
    const executeInput = {
      fromWalletId: 'wallet_123',
      toAddress: 'GBEXAMPLE',
      amount: { assetCode: 'ABCDEFGHIJKL', amount: '1.1234567' },
      memo: 'a'.repeat(64),
    };

    await executeSdk.payments.execute(executeInput);

    expect(executeSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/payments',
      body: executeInput,
    });
  });

  it('allows omitted memo and empty memo string', async () => {
    const requestSpy = resolveSpy(paymentOk);
    const sdk = sdkWithSpy(requestSpy);

    await sdk.payments.execute({
      fromWalletId: 'wallet_123',
      toAddress: 'GBEXAMPLE',
      amount: { assetCode: 'USDC', amount: '10.00' },
    });

    await sdk.payments.execute({
      fromWalletId: 'wallet_123',
      toAddress: 'GBEXAMPLE',
      amount: { assetCode: 'USDC', amount: '10.00' },
      memo: '',
    });

    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('rejects over-long memos before sending the request', async () => {
    const requestSpy = resolveSpy(paymentOk);
    const sdk = sdkWithSpy(requestSpy);

    await expect(
      sdk.payments.execute({
        fromWalletId: 'wallet_123',
        toAddress: 'GBEXAMPLE',
        amount: { assetCode: 'USDC', amount: '10.00' },
        memo: 'a'.repeat(29),
      }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid decimal amounts', async () => {
    const requestSpy = resolveSpy(quoteOk);
    const sdk = sdkWithSpy(requestSpy);
    const base = {
      fromWalletId: 'wallet_123',
      toAddress: 'GBEXAMPLE',
    };

    await expect(
      sdk.payments.quote({
        ...base,
        amount: { assetCode: 'USDC', amount: '1.12345678' },
      }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    await expect(
      sdk.payments.quote({ ...base, amount: { assetCode: 'USDC', amount: '-1' } }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    await expect(
      sdk.payments.quote({
        ...base,
        amount: { assetCode: 'USDC', amount: 'not-a-decimal' },
      }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    await expect(
      sdk.payments.quote({ ...base, amount: { assetCode: 'USDC', amount: '' } }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('rejects invalid asset codes', async () => {
    const requestSpy = resolveSpy(quoteOk);
    const sdk = sdkWithSpy(requestSpy);
    const base = {
      fromWalletId: 'wallet_123',
      toAddress: 'GBEXAMPLE',
    };

    await expect(
      sdk.payments.quote({ ...base, amount: { assetCode: '', amount: '1' } }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    await expect(
      sdk.payments.quote({
        ...base,
        amount: { assetCode: 'ABCDEFGHIJKLM', amount: '1' },
      }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    await expect(
      sdk.payments.quote({ ...base, amount: { assetCode: 'USD-C', amount: '1' } }),
    ).rejects.toBeInstanceOf(LilyValidationError);

    expect(requestSpy).not.toHaveBeenCalled();
  });
});
