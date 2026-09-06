import { encodePathSegment } from '../http/path';
import { validateNonEmptyString } from '../validation';
import type {
  PaginationQuery,
  ProvisionWalletRequest,
  Wallet,
  WalletProvisioningResult,
} from '../models';
import type { WalletClientContract } from '../types/contracts';
import { BaseClient } from './base-client';

export class WalletClient extends BaseClient implements WalletClientContract {
  public provision(
    input: ProvisionWalletRequest,
  ): Promise<WalletProvisioningResult> {
    return this.request({
      method: 'POST',
      path: '/v1/wallets/provision',
      body: input,
    });
  }

  public get(walletId: string): Promise<Wallet> {
    validateNonEmptyString(walletId, 'walletId');
    return this.request({
      method: 'GET',
      path: `/v1/wallets/${encodePathSegment(walletId)}`,
    });
  }

  public list(query: PaginationQuery = {}): Promise<readonly Wallet[]> {
    return this.request({
      method: 'GET',
      path: '/v1/wallets',
      query: {
        ...query,
      },
    });
  }
}
