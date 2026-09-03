import { describe, it, expect, vi } from 'vitest';
import { IdentityClient } from '../src/clients/identity-client';
import type { HttpClient } from '../src/http/types';

function makeMockHttpClient(): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      data: {
        id: 'ident-abc',
        agentId: 'agent-1',
        displayName: 'Test Agent',
        status: 'active',
        verificationLevel: 'basic',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      attempts: 1,
      retried: false,
    }),
  };
}

describe('IdentityClient.get', () => {
  it('sends GET /v1/identity/:id with encoded identityId', async () => {
    const mockClient = makeMockHttpClient();
    const client = new IdentityClient(mockClient);

    const result = await client.get('ident-abc');

    expect(result.id).toBe('ident-abc');
    expect(mockClient.request).toHaveBeenCalledTimes(1);
    const callArg = (mockClient.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.method).toBe('GET');
    expect(callArg.path).toBe('/v1/identity/ident-abc');
  });

  it('encodes special characters in identityId', async () => {
    const mockClient = makeMockHttpClient();
    const client = new IdentityClient(mockClient);

    await client.get('ident/with spaces');

    const callArg = (mockClient.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.path).toBe('/v1/identity/ident%2Fwith%20spaces');
  });
});
