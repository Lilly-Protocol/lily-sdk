import type { AuditMetadata, PaginationQuery, ResourceStatus } from './common';

export interface Agent extends AuditMetadata {
  id: string;
  name: string;
  description?: string;
  status: ResourceStatus;
  network: 'stellar-testnet' | 'stellar-mainnet';
  identityId?: string;
  walletId?: string;
  capabilities: readonly string[];
}

export interface ListAgentsQuery extends PaginationQuery {
  status?: ResourceStatus;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  network: Agent['network'];
  capabilities?: string[];
  metadata?: Record<string, string>;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  capabilities?: string[];
  status?: ResourceStatus;
}
