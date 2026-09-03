import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityClient } from '../src/clients/identity-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type { IdentityProfile, ResolveIdentityRequest, VerifyIdentityRequest, VerificationResult } from '../src/models';

function createMockHttpClient(responseData: unknown = {}): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: responseData,
    } as HttpResponse),
  };
}

const mockIdentity: IdentityProfile = {
  id: 'id-1',
  agentId: 'agent-1',
  displayName: 'Test Identity',
  stellarAddress: 'GABC...',
  domain: 'example.com',
  status: 'active',
  verificationLevel: 'enhanced',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockVerification: VerificationResult = {
  identityId: 'id-1',
  verified: true,
  verifiedAt: '2024-01-01T01:00:00Z',
};

describe('IdentityClient', () => {
  let httpClient: HttpClient;
  let client: IdentityClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    client = new IdentityClient(httpClient);
  });

  describe('resolve', () => {
    it('sends POST /v1/identity/resolve with the input body and returns the profile', async () => {
      const input: ResolveIdentityRequest = {
        agentId: 'agent-1',
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockIdentity,
      } as HttpResponse);

      const result = await client.resolve(input);

      expect(result).toEqual(mockIdentity);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/identity/resolve',
        body: input,
      });
    });

    it('throws LilyValidationError when no resolver key is provided', async () => {
      await expect(client.resolve({})).rejects.toBeInstanceOf(LilyValidationError);
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('throws LilyValidationError when resolver key is empty', async () => {
      await expect(client.resolve({ agentId: '   ' })).rejects.toBeInstanceOf(LilyValidationError);
      expect(httpClient.request).not.toHaveBeenCalled();
    });

    it('throws LilyValidationError when more than one resolver key is provided', async () => {
      await expect(
        client.resolve({ agentId: 'agent-1', stellarAddress: 'GABC...' }),
      ).rejects.toBeInstanceOf(LilyValidationError);
      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('sends POST /v1/identity/verify with the input body and returns the result', async () => {
      const input: VerifyIdentityRequest = {
        identityId: 'id-1',
        challenge: 'test-challenge',
        signature: 'test-signature',
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockVerification,
      } as HttpResponse);

      const result = await client.verify(input);

      expect(result.verified).toBe(true);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/identity/verify',
        body: input,
      });
    });

    it('throws LilyValidationError for empty required fields', async () => {
      await expect(
        client.verify({ identityId: '', challenge: 'c', signature: 's' }),
      ).rejects.toBeInstanceOf(LilyValidationError);
      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('throws LilyValidationError for empty identityId', async () => {
      await expect(client.get('   ')).rejects.toBeInstanceOf(LilyValidationError);
      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });
});
