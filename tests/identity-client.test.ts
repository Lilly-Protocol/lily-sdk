import { describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('IdentityClient', () => {
  it('posts agentId to /v1/identity/resolve and returns profile', async () => {
    const profile = {
      id: 'id-1',
      agentId: 'agent-1',
      displayName: 'Test Agent',
      status: 'active',
      verificationLevel: 'basic',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({ status: 200, headers: new Headers(), data: profile }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.identity.resolve({ agentId: 'agent-1' });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: { agentId: 'agent-1' },
    });
    expect(result).toEqual(profile);
  });

  it('posts stellarAddress to /v1/identity/resolve', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'id-2',
          agentId: 'agent-2',
          displayName: 'Stellar Agent',
          status: 'active',
          verificationLevel: 'enhanced',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.identity.resolve({ stellarAddress: 'GABC...' });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: { stellarAddress: 'GABC...' },
    });
  });

  it('posts domain to /v1/identity/resolve', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'id-3',
          agentId: 'agent-3',
          displayName: 'Domain Agent',
          status: 'active',
          verificationLevel: 'none',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.identity.resolve({ domain: 'example.com' });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: { domain: 'example.com' },
    });
  });

  it('posts challenge and signature to /v1/identity/verify', async () => {
    const verification = {
      identityId: 'id-1',
      verified: true,
      verifiedAt: '2026-08-31T00:00:00.000Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({ status: 200, headers: new Headers(), data: verification }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.identity.verify({
      identityId: 'id-1',
      challenge: 'chal-abc',
      signature: 'sig-xyz',
    });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/verify',
      body: {
        identityId: 'id-1',
        challenge: 'chal-abc',
        signature: 'sig-xyz',
      },
    });
    expect(result).toEqual(verification);
  });
});
