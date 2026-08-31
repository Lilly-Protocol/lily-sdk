import { describe, expect, it } from 'vitest';
import type { HttpRequest } from '../src/http/types';
import type {
  IdentityProfile,
  ResolveIdentityRequest,
  VerificationResult,
  VerifyIdentityRequest,
} from '../src/models';
import { IdentityClient } from '../src/clients/identity-client';
import { createMockHttpClient } from './helpers/mock-http-client';

const stubProfile: IdentityProfile = {
  id: 'id-1',
  agentId: 'agent-1',
  displayName: 'Test Identity',
  stellarAddress: 'GABC123',
  status: 'active',
  verificationLevel: 'basic',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const stubVerification: VerificationResult = {
  identityId: 'id-1',
  verified: true,
  verifiedAt: '2024-01-01T00:00:00Z',
};

describe('IdentityClient', () => {
  it('resolve sends POST /v1/identity/resolve with body and returns profile', async () => {
    let captured: HttpRequest<ResolveIdentityRequest> | undefined;
    const input: ResolveIdentityRequest = { agentId: 'agent-1' };

    const client = new IdentityClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<ResolveIdentityRequest>;
        return { status: 200, data: stubProfile };
      }),
    );

    const result = await client.resolve(input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('POST');
    expect(captured!.path).toBe('/v1/identity/resolve');
    expect(captured!.body).toEqual(input);
    expect(result).toEqual(stubProfile);
  });

  it('verify sends POST /v1/identity/verify with challenge and signature', async () => {
    let captured: HttpRequest<VerifyIdentityRequest> | undefined;
    const input: VerifyIdentityRequest = {
      identityId: 'id-1',
      challenge: 'challenge-abc',
      signature: 'sig-xyz',
    };

    const client = new IdentityClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<VerifyIdentityRequest>;
        return { status: 200, data: stubVerification };
      }),
    );

    const result = await client.verify(input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('POST');
    expect(captured!.path).toBe('/v1/identity/verify');
    expect(captured!.body).toEqual(input);
    expect(result).toEqual(stubVerification);
  });
});
