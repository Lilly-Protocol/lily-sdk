import type {
  IdentityProfile,
  ResolveIdentityRequest,
  VerifyIdentityRequest,
  VerificationResult,
} from '../models';
import type { IdentityClientContract } from '../types/contracts';
import { validateNonEmptyString, validateResolveIdentityRequest } from '../validation';
import { BaseClient } from './base-client';

export class IdentityClient
  extends BaseClient
  implements IdentityClientContract
{
  public resolve(input: ResolveIdentityRequest): Promise<IdentityProfile> {
    validateResolveIdentityRequest(input);
    return this.request({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: input,
    });
  }

  public verify(input: VerifyIdentityRequest): Promise<VerificationResult> {
    validateNonEmptyString(input.identityId, 'identityId');
    validateNonEmptyString(input.challenge, 'challenge');
    validateNonEmptyString(input.signature, 'signature');
    return this.request({
      method: 'POST',
      path: '/v1/identity/verify',
      body: input,
    });
  }

  public get(identityId: string): Promise<IdentityProfile> {
    validateNonEmptyString(identityId, 'identityId');
    return this.request({
      method: 'GET',
      path: `/v1/identity/${encodeURIComponent(identityId)}`,
    });
  }
}
