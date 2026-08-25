import { describe, expect, it, vi } from 'vitest';

import { IdentityClient } from '../src/clients/identity-client';
import type {
  ResolveIdentityRequest,
  VerificationResult,
} from '../src/models/identity';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('IdentityClient', () => {
  it.each<[string, ResolveIdentityRequest]>([
    ['agent ID', { agentId: 'agent_123' }],
    ['Stellar address', { stellarAddress: 'GABC123' }],
    ['domain', { domain: 'agent.example' }],
  ])('resolves an identity by %s', async (_resolver, input) => {
    const profile = {
      id: 'identity_123',
      agentId: 'agent_123',
      displayName: 'Test Agent',
      status: 'active' as const,
      verificationLevel: 'basic' as const,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: profile,
      }),
    );
    const client = new IdentityClient(createMockHttpClient(requestSpy));

    await expect(client.resolve(input)).resolves.toBe(profile);
    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: input,
    });
  });

  it('verifies an identity with its challenge and Stellar signature', async () => {
    const input = {
      identityId: 'identity_123',
      challenge: 'challenge-to-sign',
      signature: 'stellar-signature',
    };
    const result: VerificationResult = {
      identityId: input.identityId,
      verified: true,
      verifiedAt: '2025-01-01T00:00:00.000Z',
    };
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: result,
      }),
    );
    const client = new IdentityClient(createMockHttpClient(requestSpy));

    await expect(client.verify(input)).resolves.toBe(result);
    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/verify',
      body: input,
    });
  });
});
