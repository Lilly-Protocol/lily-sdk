import type { AuditMetadata, MoneyAmount, ResourceStatus } from './common';

export interface Wallet extends AuditMetadata {
  id: string;
  agentId: string;
  address: string;
  network: 'stellar-testnet' | 'stellar-mainnet';
  status: ResourceStatus;
  balances: readonly MoneyAmount[];
}

export interface ProvisionWalletRequest {
  agentId: string;
  network: Wallet['network'];
  fundingAsset?: {
    assetCode: string;
    amount: string;
  };
}

export interface WalletProvisioningResult {
  wallet: Wallet;
  recoveryHint?: string;
}
