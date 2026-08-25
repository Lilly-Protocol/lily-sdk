import { describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import { LilyValidationError } from '../src/errors/sdk-error';
import { assertMemo, assertMoneyAmount } from '../src/validation/payment';
import { createMockHttpClient } from './helpers/mock-http-client';

function sdk() {
  const requestSpy = vi.fn(() =>
    Promise.resolve({
      status: 200,
      headers: new Headers(),
      data: { id: 'p1', status: 'queued' },
    }),
  );
  return {
    requestSpy,
    client: new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    ),
  };
}

const validAmount = { assetCode: 'XLM', amount: '1.0000000' };

describe('payment input validation', () => {
  it('accepts a 28-byte text memo and 7-digit amount', () => {
    assertMemo('a'.repeat(28));
    assertMoneyAmount({ assetCode: 'USDC', amount: '0' });
    assertMoneyAmount({ assetCode: 'XLM', amount: '1.1234567' });
  });

  it('rejects an over-long text memo', () => {
    expect(() => assertMemo('a'.repeat(29))).toThrow(LilyValidationError);
  });

  it('accepts a 64-hex memo and rejects 65 hex', () => {
    assertMemo('ab'.repeat(32));
    expect(() => assertMemo('ab'.repeat(32) + 'cd')).toThrow(LilyValidationError);
  });

  it('rejects negative and 8-fractional-digit amounts', () => {
    expect(() => assertMoneyAmount({ assetCode: 'XLM', amount: '-1' })).toThrow(LilyValidationError);
    expect(() => assertMoneyAmount({ assetCode: 'XLM', amount: '1.12345678' })).toThrow(
      LilyValidationError,
    );
  });

  it('rejects empty amount and invalid asset codes', () => {
    expect(() => assertMoneyAmount({ assetCode: 'XLM', amount: '' })).toThrow(LilyValidationError);
    expect(() => assertMoneyAmount({ assetCode: '', amount: '1' })).toThrow(LilyValidationError);
    expect(() => assertMoneyAmount({ assetCode: 'THIS_IS_TOO_LONG', amount: '1' })).toThrow(
      LilyValidationError,
    );
  });

  it('execute rejects invalid memo before transport', () => {
    const { client, requestSpy } = sdk();
    expect(() =>
      void client.payments.execute({
        fromWalletId: 'w1',
        toAddress: 'GABC',
        amount: validAmount,
        memo: 'a'.repeat(29),
      }),
    ).toThrow(LilyValidationError);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('execute and quote pass valid inputs unchanged', async () => {
    const { client, requestSpy } = sdk();
    await client.payments.execute({
      fromWalletId: 'w1',
      toAddress: 'GABC',
      amount: validAmount,
      memo: 'ok',
    });
    await client.payments.quote({
      fromWalletId: 'w1',
      toAddress: 'GABC',
      amount: { assetCode: 'USDC', amount: '0' },
    });
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });
});
