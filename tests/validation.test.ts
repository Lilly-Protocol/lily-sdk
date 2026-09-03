import { describe, expect, it } from 'vitest';

import { LilyValidationError } from '../src/errors/sdk-error';
import {
  validateCreateAgentRequest,
  validateExecutePaymentRequest,
  validateMoneyAmount,
  validateNetwork,
  validateNonEmptyString,
  validatePaymentQuoteRequest,
  validateProvisionWalletRequest,
  validateResolveIdentityRequest,
  validateUpdateAgentRequest,
} from '../src/validation';

describe('validateNonEmptyString', () => {
  it('accepts non-empty strings', () => {
    expect(() => validateNonEmptyString('abc', 'field')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validateNonEmptyString('', 'field')).toThrow(
      LilyValidationError,
    );
  });

  it('rejects whitespace-only string', () => {
    expect(() => validateNonEmptyString('   ', 'field')).toThrow(
      LilyValidationError,
    );
  });

  it('rejects non-string values', () => {
    expect(() => validateNonEmptyString(123 as any, 'field')).toThrow(
      LilyValidationError,
    );
    expect(() => validateNonEmptyString(undefined as any, 'field')).toThrow(
      LilyValidationError,
    );
  });
});

describe('validateMoneyAmount', () => {
  it('accepts valid MoneyAmount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '10.50' }, 'test'),
    ).not.toThrow();
  });

  it('accepts integer amount string', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'XLM', amount: '100' }, 'test'),
    ).not.toThrow();
  });

  it('rejects invalid asset code', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: '', amount: '10' }, 'test'),
    ).toThrow(/assetCode/);
  });

  it('rejects asset code longer than 12 chars', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'ABCDEFGHIJKLM', amount: '10' }, 'test'),
    ).toThrow(/assetCode/);
  });

  it('rejects negative amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '-5' }, 'test'),
    ).toThrow(/amount/);
  });

  it('rejects scientific notation amount', () => {
    expect(() =>
      validateMoneyAmount({ assetCode: 'USDC', amount: '1e3' }, 'test'),
    ).toThrow(/amount/);
  });

  it('rejects missing amount object', () => {
    expect(() => validateMoneyAmount(null as any, 'test')).toThrow(
      LilyValidationError,
    );
  });
});

describe('validateResolveIdentityRequest', () => {
  it('accepts exactly one resolver key', () => {
    expect(() =>
      validateResolveIdentityRequest({ agentId: 'agent-1' }),
    ).not.toThrow();
    expect(() =>
      validateResolveIdentityRequest({ stellarAddress: 'alice*example.com' }),
    ).not.toThrow();
    expect(() =>
      validateResolveIdentityRequest({ domain: 'example.com' }),
    ).not.toThrow();
  });

  it('rejects zero resolver keys', () => {
    expect(() => validateResolveIdentityRequest({})).toThrow(/exactly one/);
  });

  it('rejects multiple resolver keys', () => {
    expect(() =>
      validateResolveIdentityRequest({ agentId: 'a', stellarAddress: 'b' }),
    ).toThrow(/only one/);
  });

  it('rejects empty string resolver value', () => {
    expect(() => validateResolveIdentityRequest({ agentId: '' })).toThrow(
      /non-empty/,
    );
  });
});

describe('validateExecutePaymentRequest', () => {
  it('accepts valid request', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10.00' },
      }),
    ).not.toThrow();
  });

  it('rejects empty fromWalletId', () => {
    expect(() =>
      validateExecutePaymentRequest({
        fromWalletId: '',
        toAddress: 'GABC...',
        amount: { assetCode: 'USDC', amount: '10' },
      }),
    ).toThrow(/fromWalletId/);
  });
});

describe('validatePaymentQuoteRequest', () => {
  it('accepts valid request', () => {
    expect(() =>
      validatePaymentQuoteRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'XLM', amount: '50' },
      }),
    ).not.toThrow();
  });

  it('rejects invalid amount format', () => {
    expect(() =>
      validatePaymentQuoteRequest({
        fromWalletId: 'wallet-1',
        toAddress: 'GABC...',
        amount: { assetCode: 'XLM', amount: 'abc' },
      }),
    ).toThrow(/amount/);
  });
});

describe('validateNetwork', () => {
  it('accepts stellar-testnet and stellar-mainnet', () => {
    expect(() =>
      validateNetwork('stellar-testnet', 'TestContext'),
    ).not.toThrow();
    expect(() =>
      validateNetwork('stellar-mainnet', 'TestContext'),
    ).not.toThrow();
  });

  it('rejects unsupported network strings', () => {
    expect(() => validateNetwork('bitcoin', 'TestContext')).toThrow(
      LilyValidationError,
    );
    expect(() => validateNetwork('ethereum', 'TestContext')).toThrow(
      /TestContext: `network` must be 'stellar-testnet' or 'stellar-mainnet'\. Got "ethereum"\./,
    );
  });

  it('rejects non-string or empty network values', () => {
    expect(() => validateNetwork('', 'TestContext')).toThrow(
      LilyValidationError,
    );
    expect(() => validateNetwork(null, 'TestContext')).toThrow(/Got null\./);
    expect(() => validateNetwork(undefined, 'TestContext')).toThrow(
      /Got undefined\./,
    );
    expect(() => validateNetwork(123, 'TestContext')).toThrow(
      LilyValidationError,
    );
  });
});

describe('validateProvisionWalletRequest', () => {
  it('accepts valid request without fundingAsset', () => {
    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-testnet',
      }),
    ).not.toThrow();
  });

  it('accepts valid request with fundingAsset', () => {
    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-mainnet',
        fundingAsset: {
          assetCode: 'USDC',
          amount: '50.00',
        },
      }),
    ).not.toThrow();
  });

  it('rejects null or non-object request', () => {
    expect(() => validateProvisionWalletRequest(null as any)).toThrow(
      'ProvisionWalletRequest: payload is required.',
    );
    expect(() => validateProvisionWalletRequest('string' as any)).toThrow(
      'ProvisionWalletRequest: payload is required.',
    );
  });

  it('rejects empty or missing agentId', () => {
    expect(() =>
      validateProvisionWalletRequest({
        agentId: '',
        network: 'stellar-testnet',
      }),
    ).toThrow(/`agentId` must be a non-empty string\./);

    expect(() =>
      validateProvisionWalletRequest({
        agentId: '   ',
        network: 'stellar-testnet',
      }),
    ).toThrow(LilyValidationError);
  });

  it('rejects invalid network', () => {
    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'solana' as any,
      }),
    ).toThrow(
      /ProvisionWalletRequest: `network` must be 'stellar-testnet' or 'stellar-mainnet'\./,
    );
  });

  it('rejects non-object fundingAsset', () => {
    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: 'invalid' as any,
      }),
    ).toThrow('ProvisionWalletRequest: `fundingAsset` must be an object.');
  });

  it('rejects fundingAsset with invalid assetCode or amount', () => {
    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: {
          assetCode: '',
          amount: '10',
        },
      }),
    ).toThrow(/`fundingAsset\.assetCode` must be a non-empty string\./);

    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: {
          assetCode: 'XLM',
          amount: '',
        },
      }),
    ).toThrow(/`fundingAsset\.amount` must be a non-empty string\./);

    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: {
          assetCode: 'XLM',
          amount: 'abc',
        },
      }),
    ).toThrow(
      'ProvisionWalletRequest: `fundingAsset.amount` must be a non-negative decimal string.',
    );

    expect(() =>
      validateProvisionWalletRequest({
        agentId: 'agent-1',
        network: 'stellar-testnet',
        fundingAsset: {
          assetCode: 'XLM',
          amount: '-10',
        },
      }),
    ).toThrow(
      'ProvisionWalletRequest: `fundingAsset.amount` must be a non-negative decimal string.',
    );
  });
});

describe('validateCreateAgentRequest', () => {
  it('accepts valid minimal and full requests', () => {
    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent Smith',
        network: 'stellar-testnet',
      }),
    ).not.toThrow();

    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent Smith',
        network: 'stellar-mainnet',
        capabilities: ['trading', 'analysis'],
        description: 'Autonomous trading bot',
        metadata: { env: 'prod' },
      }),
    ).not.toThrow();
  });

  it('rejects null or non-object request', () => {
    expect(() => validateCreateAgentRequest(null as any)).toThrow(
      'CreateAgentRequest: payload is required.',
    );
  });

  it('rejects empty or non-string name', () => {
    expect(() =>
      validateCreateAgentRequest({
        name: '',
        network: 'stellar-testnet',
      }),
    ).toThrow(/`name` must be a non-empty string\./);

    expect(() =>
      validateCreateAgentRequest({
        name: '   ',
        network: 'stellar-testnet',
      }),
    ).toThrow(LilyValidationError);
  });

  it('rejects invalid network', () => {
    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'polygon' as any,
      }),
    ).toThrow(
      /CreateAgentRequest: `network` must be 'stellar-testnet' or 'stellar-mainnet'\./,
    );
  });

  it('rejects invalid capabilities', () => {
    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'stellar-testnet',
        capabilities: 'not-array' as any,
      }),
    ).toThrow(
      'CreateAgentRequest: `capabilities` must be an array of non-empty strings.',
    );

    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'stellar-testnet',
        capabilities: ['valid', ''],
      }),
    ).toThrow(
      'CreateAgentRequest: `capabilities` must be an array of non-empty strings.',
    );

    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'stellar-testnet',
        capabilities: ['valid', 123 as any],
      }),
    ).toThrow(
      'CreateAgentRequest: `capabilities` must be an array of non-empty strings.',
    );
  });

  it('rejects invalid description', () => {
    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'stellar-testnet',
        description: 123 as any,
      }),
    ).toThrow(
      'CreateAgentRequest: `description` must be a string when provided.',
    );
  });

  it('rejects invalid metadata', () => {
    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'stellar-testnet',
        metadata: 'string' as any,
      }),
    ).toThrow(
      'CreateAgentRequest: `metadata` must be an object when provided.',
    );

    expect(() =>
      validateCreateAgentRequest({
        name: 'Agent',
        network: 'stellar-testnet',
        metadata: ['array'] as any,
      }),
    ).toThrow(
      'CreateAgentRequest: `metadata` must be an object when provided.',
    );
  });
});

describe('validateUpdateAgentRequest', () => {
  it('accepts empty update object and valid partial fields', () => {
    expect(() => validateUpdateAgentRequest({})).not.toThrow();

    expect(() =>
      validateUpdateAgentRequest({
        name: 'New Name',
        description: 'New Description',
        status: 'active',
        capabilities: ['exec'],
      }),
    ).not.toThrow();
  });

  it('rejects null or non-object request', () => {
    expect(() => validateUpdateAgentRequest(null as any)).toThrow(
      'UpdateAgentRequest: payload is required.',
    );
  });

  it('rejects empty name when provided', () => {
    expect(() => validateUpdateAgentRequest({ name: '' })).toThrow(
      /`name` must be a non-empty string\./,
    );
    expect(() => validateUpdateAgentRequest({ name: '  ' })).toThrow(
      LilyValidationError,
    );
  });

  it('rejects invalid capabilities when provided', () => {
    expect(() =>
      validateUpdateAgentRequest({ capabilities: 'wrong' as any }),
    ).toThrow(
      'UpdateAgentRequest: `capabilities` must be an array of non-empty strings.',
    );

    expect(() => validateUpdateAgentRequest({ capabilities: [''] })).toThrow(
      'UpdateAgentRequest: `capabilities` must be an array of non-empty strings.',
    );
  });

  it('rejects invalid status when provided', () => {
    expect(() =>
      validateUpdateAgentRequest({ status: 'unknown' as any }),
    ).toThrow(
      'UpdateAgentRequest: `status` must be one of pending, active, inactive, failed, paused.',
    );
  });

  it('accepts each valid status', () => {
    const validStatuses = [
      'pending',
      'active',
      'inactive',
      'failed',
      'paused',
    ] as const;
    for (const status of validStatuses) {
      expect(() => validateUpdateAgentRequest({ status })).not.toThrow();
    }
  });

  it('rejects invalid description when provided', () => {
    expect(() =>
      validateUpdateAgentRequest({ description: 999 as any }),
    ).toThrow(
      'UpdateAgentRequest: `description` must be a string when provided.',
    );
  });
});
