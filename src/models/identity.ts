import type { AuditMetadata, ResourceStatus } from './common';

export interface IdentityProfile extends AuditMetadata {
  id: string;
  agentId: string;
  displayName: string;
  stellarAddress?: string;
  domain?: string;
  status: ResourceStatus;
  verificationLevel: 'none' | 'basic' | 'enhanced';
}

export interface ResolveIdentityRequest {
  agentId?: string;
  stellarAddress?: string;
  domain?: string;
}

export interface VerifyIdentityRequest {
  identityId: string;
  challenge: string;
  signature: string;
}

export interface VerificationResult {
  identityId: string;
  verified: boolean;
  verifiedAt?: string;
}
