import { describe, it, expect, vi } from 'vitest';
import { LilySdk } from '../src/sdk';
import { LilyValidationError } from '../src/errors/sdk-error';
import type { HttpClient } from '../src/http/types';

function createMockHttpClient(responseData: unknown): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: responseData,
    }),
  };
}

describe('LilySdk response validation (issue #413)', () => {
  const invalidPayload = { status: 'unrecognized_status', version: 123 };
  const validPayload = { status: 'ok', version: '1.0.0', uptime: 3600 };

  it('rejects malformed health payload with LilyValidationError by default (validateResponses defaults to true)', async () => {
    const mockHttp = createMockHttpClient(invalidPayload);
    const sdk = new LilySdk({ baseUrl: 'https://api.example.com' }, mockHttp);

    expect(sdk.config.validateResponses).toBe(true);
    await expect(sdk.system.health()).rejects.toThrow(LilyValidationError);
  });

  it('rejects malformed health payload with LilyValidationError when validateResponses: true is explicitly provided', async () => {
    const mockHttp = createMockHttpClient(invalidPayload);
    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com', validateResponses: true },
      mockHttp,
    );

    expect(sdk.config.validateResponses).toBe(true);
    await expect(sdk.system.health()).rejects.toThrow(LilyValidationError);
    try {
      await sdk.system.health();
    } catch (err) {
      expect(err).toBeInstanceOf(LilyValidationError);
      expect((err as LilyValidationError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('returns valid health payload by default (when validateResponses is not specified)', async () => {
    const mockHttp = createMockHttpClient(validPayload);
    const sdk = new LilySdk({ baseUrl: 'https://api.example.com' }, mockHttp);

    const result = await sdk.system.health();
    expect(result).toEqual(validPayload);
  });

  it('returns valid health payload when validateResponses is enabled', async () => {
    const mockHttp = createMockHttpClient(validPayload);
    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com', validateResponses: true },
      mockHttp,
    );

    const result = await sdk.system.health();
    expect(result).toEqual(validPayload);
  });

  it('returns raw malformed health payload unchanged when validateResponses: false', async () => {
    const mockHttp = createMockHttpClient(invalidPayload);
    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com', validateResponses: false },
      mockHttp,
    );

    expect(sdk.config.validateResponses).toBe(false);
    const result = await sdk.system.health();
    expect(result).toEqual(invalidPayload);
  });

  it('preserves validateResponses: false across withConfig calls', async () => {
    const mockHttp = createMockHttpClient(invalidPayload);
    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com', validateResponses: false },
      mockHttp,
    );

    const reconfiguredSdk = sdk.withConfig({ timeoutMs: 5000 });
    expect(reconfiguredSdk.config.validateResponses).toBe(false);
  });

  it('preserves validateResponses: true across withConfig calls', async () => {
    const mockHttp = createMockHttpClient(invalidPayload);
    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com', validateResponses: true },
      mockHttp,
    );

    const reconfiguredSdk = sdk.withConfig({ timeoutMs: 5000 });
    expect(reconfiguredSdk.config.validateResponses).toBe(true);
  });

  it('allows overriding validateResponses in withConfig', async () => {
    const mockHttp = createMockHttpClient(invalidPayload);
    const sdk = new LilySdk(
      { baseUrl: 'https://api.example.com', validateResponses: false },
      mockHttp,
    );

    const validatingSdk = sdk.withConfig({ validateResponses: true });
    expect(validatingSdk.config.validateResponses).toBe(true);

    const nonValidatingSdk = validatingSdk.withConfig({
      validateResponses: false,
    });
    expect(nonValidatingSdk.config.validateResponses).toBe(false);
  });
});
