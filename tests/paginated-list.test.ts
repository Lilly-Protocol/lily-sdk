import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #62 — $40
 * "Add paginated `WalletClient.list` and `PaymentClient.list`"
 */
describe('paginated list methods', () => {
  it('WalletClient has a list method', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/clients/wallet-client.ts'),
      'utf8',
    );
    expect(content).toContain('list');
  });

  it('PaymentClient has a list method', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/clients/payment-client.ts'),
      'utf8',
    );
    expect(content).toContain('list');
  });

  it('PaginationQuery type is defined in common models', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/models/common.ts'),
      'utf8',
    );
    expect(content).toContain('PaginationQuery');
    expect(content).toContain('limit');
    expect(content).toContain('cursor');
  });
});
