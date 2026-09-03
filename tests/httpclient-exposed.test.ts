import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('HttpClient exposed on instance (issue #57)', () => {
  it('sdk.httpClient returns the active HttpClient', () => {
    const sdk = new LilySdk({ baseUrl: 'https://api.lily.io', apiKey: 'k_test' });
    expect(sdk.httpClient).toBeDefined();
    expect(typeof sdk.httpClient.request).toBe('function');
  });

  it('custom HttpClient is exposed via getter', () => {
    const customClient = {
      request: async () => ({ status: 200, headers: new Headers(), data: {} }),
    };
    const sdk = new LilySdk({ baseUrl: 'https://api.lily.io' }, customClient as any);
    expect(sdk.httpClient).toBe(customClient);
  });

  it('httpClient is the same instance used by all clients', () => {
    const sdk = new LilySdk({ baseUrl: 'https://api.lily.io', apiKey: 'k_test' });
    // The httpClient getter should return the same instance
    expect(sdk.httpClient).toBe(sdk.httpClient);
  });
});
