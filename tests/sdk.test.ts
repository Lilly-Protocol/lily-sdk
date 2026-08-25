import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LilyConfigError } from '../src/errors/sdk-error';
import { createFetchHttpClient } from '../src/http/fetch-http-client';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

const clientConstructors = vi.hoisted(() => ({
  AgentClient: vi.fn(),
  WalletClient: vi.fn(),
  PaymentClient: vi.fn(),
  IdentityClient: vi.fn(),
  SystemClient: vi.fn(),
}));

vi.mock('../src/clients/agent-client', () => ({
  AgentClient: clientConstructors.AgentClient,
}));
vi.mock('../src/clients/wallet-client', () => ({
  WalletClient: clientConstructors.WalletClient,
}));
vi.mock('../src/clients/payment-client', () => ({
  PaymentClient: clientConstructors.PaymentClient,
}));
vi.mock('../src/clients/identity-client', () => ({
  IdentityClient: clientConstructors.IdentityClient,
}));
vi.mock('../src/clients/system-client', () => ({
  SystemClient: clientConstructors.SystemClient,
}));
vi.mock('../src/http/fetch-http-client', () => ({
  createFetchHttpClient: vi.fn(),
}));

const fetchHttpClientMock = vi.mocked(createFetchHttpClient);
const constructors = Object.values(clientConstructors);

describe('LilySdk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes an injected HttpClient to all five client modules', () => {
    const httpClient = createMockHttpClient(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: { ok: true },
      }),
    );

    const sdk = new LilySdk(
      {
        baseUrl: 'https://api.lily.test',
        fetch: globalThis.fetch,
      },
      httpClient,
    );

    expect(sdk.config.baseUrl.toString()).toBe('https://api.lily.test/');
    for (const constructor of constructors) {
      expect(constructor).toHaveBeenCalledOnce();
      expect(constructor).toHaveBeenCalledWith(httpClient);
    }
    expect(fetchHttpClientMock).not.toHaveBeenCalled();
  });

  it('creates the default HttpClient from the resolved config', () => {
    const defaultHttpClient = createMockHttpClient(() =>
      Promise.reject(new Error('unused')),
    );
    fetchHttpClientMock.mockReturnValue(defaultHttpClient);

    const sdk = new LilySdk({
      baseUrl: 'https://api.lily.test/v1',
      timeoutMs: 2_000,
      fetch: globalThis.fetch,
    });

    expect(fetchHttpClientMock).toHaveBeenCalledOnce();
    expect(fetchHttpClientMock).toHaveBeenCalledWith(sdk.config);
    for (const constructor of constructors) {
      expect(constructor).toHaveBeenCalledWith(defaultHttpClient);
    }
  });

  it('throws LilyConfigError before creating a transport or client', () => {
    expect(() => new LilySdk({ baseUrl: 'not an absolute URL' })).toThrow(
      LilyConfigError,
    );

    expect(fetchHttpClientMock).not.toHaveBeenCalled();
    for (const constructor of constructors) {
      expect(constructor).not.toHaveBeenCalled();
    }
  });
});
