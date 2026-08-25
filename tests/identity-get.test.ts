import { describe, it, expect, vi } from 'vitest';
import { IdentityClient } from '../src/clients/identity-client';
import type { HttpClient } from '../src/http/types';

/**
 * Bounty #76 — $65
 * "Add `IdentityClient.get(identityId)`"
 */
describe('IdentityClient.get', () => {
  it('sends GET /v1/identity/:identityId', async () => {
    const httpClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'idn_123',
          address: 'GABC123',
          status: 'active',
        },
      }),
    };
    const client = new IdentityClient(httpClient);
    await client.get('idn_123');

    const request = (httpClient.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.method).toBe('GET');
    expect(request.path).toBe('/v1/identity/idn_123');
  });

  it('returns the identity profile data', async () => {
    const profile = { id: 'idn_456', address: 'GXYZ', status: 'active' };
    const httpClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
        data: profile,
      }),
    };
    const client = new IdentityClient(httpClient);
    const result = await client.get('idn_456');
    expect(result).toEqual(profile);
  });

  it('propagates errors from the transport', async () => {
    const httpClient: HttpClient = {
      request: vi.fn().mockRejectedValue(new Error('network error')),
    };
    const client = new IdentityClient(httpClient);
    await expect(client.get('idn_789')).rejects.toThrow('network error');
  });
});
