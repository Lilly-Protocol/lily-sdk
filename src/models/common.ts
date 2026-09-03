export interface AuditMetadata {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

export interface MoneyAmount {
  assetCode: string;
  assetIssuer?: string;
  amount: string;
}

export type ResourceStatus = 'pending' | 'active' | 'inactive' | 'failed' | 'paused';
