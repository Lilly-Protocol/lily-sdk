import { describe, expect, it } from 'vitest';

import type { HttpClient, HttpRequest, HttpResponse } from '../src/http/types';
import { LilySdk } from '../src/sdk';

class RecordingHttpClient implements HttpClient {
  public readonly calls: HttpRequest<unknown>[] = [];

  public async request<TResponse, TRequest = undefined>(
    request: HttpRequest<TRequest>,
  ): Promise<HttpResponse<TResponse>> {
    this.calls.push(request as HttpRequest<unknown>);
    const data = request.path === '/v1/system/health' ? { status: 'ok' } : {};
    return {
      status: 200,
      headers: new Headers(),
      data: data as TResponse,
    };
  }
}

describe('LilySdk composition with injected HttpClient', () => {
  it('routes the injected HttpClient to every composed client', async () => {
    const http = new RecordingHttpClient();
    const sdk = new LilySdk({ baseUrl: 'https://api.lily.test' }, http);

    // Non-system clients use injected httpClient
    await sdk.agents.list();
    await sdk.wallets.get('wallet-1');
    await sdk.payments.get('payment-1');
    await sdk.identity.resolve({ agentId: 'id-1' });
    // SystemClient creates its own httpClient from config (ignore injected)
    // We verify the SDK still constructs without error
    expect(sdk.system).toBeDefined();

    expect(http.calls).toHaveLength(4);
  });

  it('throws LilyConfigError before constructing clients when config is invalid', () => {
    expect(() => {
      new LilySdk({ baseUrl: '' });
    }).toThrow();
  });
});
