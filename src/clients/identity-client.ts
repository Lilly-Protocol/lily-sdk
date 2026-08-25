import type {
  IdentityProfile,
  ResolveIdentityRequest,
  VerifyIdentityRequest,
  VerificationResult,
} from '../models';
import type { IdentityClientContract } from '../types/contracts';
import { BaseClient } from './base-client';

export class IdentityClient
  extends BaseClient
  implements IdentityClientContract
{
  public resolve(input: ResolveIdentityRequest): Promise<IdentityProfile> {
    this.requireAtLeastOneNonEmptyString(input, [
      'agentId',
      'stellarAddress',
      'domain',
    ]);

    return this.request({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: input,
    });
  }

  public verify(input: VerifyIdentityRequest): Promise<VerificationResult> {
    this.requireNonEmptyString(input?.identityId, 'identityId');
    this.requireNonEmptyString(input?.challenge, 'challenge');
    this.requireNonEmptyString(input?.signature, 'signature');

    return this.request({
      method: 'POST',
      path: '/v1/identity/verify',
      body: input,
    });
  }
}
