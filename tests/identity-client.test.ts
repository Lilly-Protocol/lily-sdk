import { describe, expect, it, vi } from 'vitest';

import type { IdentityProfile, VerificationResult } from '../src/models';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('IdentityClient', () => {
  // ─── resolve ───────────────────────────────────────────
  it('resolve sends POST /v1/identity/resolve with ResolveIdentityRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'id-001',
          type: 'agent',
          name: 'Agent Smith',
          verified: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } satisfies IdentityProfile,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = {
      identifier: 'agent-001',
      type: 'agent' as const,
    };

    const result = await sdk.identity.resolve(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/resolve',
      body: input,
    });
    expect(result.id).toBe('id-001');
    expect(result.name).toBe('Agent Smith');
    expect(result.verified).toBe(true);
  });

  it('resolve return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'id-pt',
      type: 'user',
      name: 'Test User',
      verified: false,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.identity.resolve({
      identifier: 'test-user',
      type: 'user' as const,
    });

    expect(result).toEqual(mockData);
  });

  // ─── verify ───────────────────────────────────────────
  it('verify sends POST /v1/identity/verify with VerifyIdentityRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          verified: true,
          score: 0.95,
          checks: [
            { name: 'document', passed: true },
            { name: 'biometric', passed: true },
            { name: 'liveness', passed: true },
          ],
          verifiedAt: '2026-01-01T00:00:00Z',
        } satisfies VerificationResult,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = {
      identityId: 'id-001',
      documentHash: '0xabc123',
      biometricHash: '0xdef456',
    };

    const result = await sdk.identity.verify(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/identity/verify',
      body: input,
    });
    expect(result.verified).toBe(true);
    expect(result.score).toBe(0.95);
    expect(result.checks).toHaveLength(3);
    expect(result.checks[0].passed).toBe(true);
  });

  it('verify return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      verified: false,
      score: 0.3,
      checks: [
        { name: 'document', passed: true },
        { name: 'biometric', passed: false },
      ],
      verifiedAt: '2026-03-15T10:00:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.identity.verify({
      identityId: 'id-1',
      documentHash: 'hash',
      biometricHash: 'bio',
    });

    expect(result).toEqual(mockData);
  });
});
