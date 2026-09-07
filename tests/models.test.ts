import { describe, expect, it } from 'vitest';

import type { MoneyAmount } from '../src/models/common';

describe('MoneyAmount model semantics', () => {
  it('allows valid native asset definitions without issuer', () => {
    const nativeAmount: MoneyAmount = {
      assetCode: 'XLM',
      amount: '25.5000000',
    };

    expect(nativeAmount.assetCode).toBe('XLM');
    expect(nativeAmount.assetIssuer).toBeUndefined();
    expect(nativeAmount.amount).toBe('25.5000000');
    expect(typeof nativeAmount.amount).toBe('string');
  });

  it('allows valid issued asset definitions with issuer public key', () => {
    const issuedAmount: MoneyAmount = {
      assetCode: 'USDC',
      assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '100.00',
    };

    expect(issuedAmount.assetCode).toBe('USDC');
    expect(issuedAmount.assetIssuer).toBe(
      'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    );
    expect(issuedAmount.amount).toBe('100.00');
    expect(typeof issuedAmount.amount).toBe('string');
  });

  it('supports stroop sub-unit decimal precision', () => {
    const stroopAmount: MoneyAmount = {
      assetCode: 'XLM',
      amount: '0.0000001',
    };

    expect(stroopAmount.amount).toBe('0.0000001');
    expect(stroopAmount.amount.split('.')[1]?.length).toBe(7);
  });
});
