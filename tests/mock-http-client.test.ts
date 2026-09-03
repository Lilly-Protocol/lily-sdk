import { describe, expect, it, vi } from 'vitest';

import { LilySdk } from '../src/sdk';
import { MockHttpClient, createMockHttpClient } from '../src/testing';
import type { RecordedHttpRequest } from '../src/testing';
import type { HttpRequest, HttpResponse } from '../src/http/types';

describe('MockHttpClient', () => {
  it('returns default 200 OK canned response when no stubs are configured', async () => {
    const client = createMockHttpClient();

    const response = await client.request({
      method: 'GET',
      path: '/v1/system/health',
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({});
    expect(response.headers).toBeInstanceOf(Headers);
    expect(response.attempts).toBe(1);
    expect(response.retried).toBe(false);

    expect(client.requests).toHaveLength(1);
    expect(client.calls).toHaveLength(1);
    expect(client.lastRequest?.path).toBe('/v1/system/health');
  });

  it('supports passing raw canned data to createMockHttpClient', async () => {
    const canned = { id: 'agent_123', name: 'Test Agent' };
    const client = createMockHttpClient(canned);

    const response = await client.request<{ id: string; name: string }>({
      method: 'GET',
      path: '/v1/agents/agent_123',
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual(canned);
  });

  it('supports passing a handler function matching existing internal helper API', async () => {
    const requestSpy = vi.fn(async (req: HttpRequest<unknown>) => ({
      status: 201,
      headers: new Headers({ 'x-custom': 'val' }),
      data: { created: true, path: req.path },
    }));

    const client = createMockHttpClient(requestSpy);

    const res = await client.request({
      method: 'POST',
      path: '/v1/agents',
      body: { name: 'New Agent' },
    });

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(res.data).toEqual({ created: true, path: '/v1/agents' });
    expect(res.headers.get('x-custom')).toBe('val');

    client.assertCalled(1);
    client.assertLastRequest({
      method: 'POST',
      path: '/v1/agents',
      body: { name: 'New Agent' },
    });
  });

  describe('Response Stubbing', () => {
    it('supports stubbing by path and method via .on() and HTTP verb shortcuts', async () => {
      const client = new MockHttpClient();

      client
        .onGet('/v1/agents', [{ id: '1' }, { id: '2' }])
        .onPost('/v1/agents', { status: 201, data: { id: '3' } })
        .onPut('/v1/agents/3', { id: '3', updated: true })
        .onPatch('/v1/agents/3', { id: '3', patched: true })
        .onDelete('/v1/agents/3', { status: 204, data: null });

      const getRes = await client.request({
        method: 'GET',
        path: '/v1/agents',
      });
      expect(getRes.status).toBe(200);
      expect(getRes.data).toEqual([{ id: '1' }, { id: '2' }]);

      const postRes = await client.request({
        method: 'POST',
        path: '/v1/agents',
        body: { name: 'Agent 3' },
      });
      expect(postRes.status).toBe(201);
      expect(postRes.data).toEqual({ id: '3' });

      const putRes = await client.request({
        method: 'PUT',
        path: '/v1/agents/3',
      });
      expect(putRes.data).toEqual({ id: '3', updated: true });

      const patchRes = await client.request({
        method: 'PATCH',
        path: '/v1/agents/3',
      });
      expect(patchRes.data).toEqual({ id: '3', patched: true });

      const delRes = await client.request({
        method: 'DELETE',
        path: '/v1/agents/3',
      });
      expect(delRes.status).toBe(204);

      expect(client.requests).toHaveLength(5);
    });

    it('supports regex path matching', async () => {
      const client = createMockHttpClient();
      client.onGet(/\/v1\/agents\/agent_\d+/, {
        status: 200,
        data: { found: true },
      });

      const res = await client.request({
        method: 'GET',
        path: '/v1/agents/agent_999',
      });
      expect(res.data).toEqual({ found: true });
    });

    it('supports header and query matching', async () => {
      const client = createMockHttpClient();

      client.stub(
        {
          method: 'GET',
          path: '/v1/agents',
          headers: { Authorization: 'Bearer secret-token' },
          query: { status: 'active' },
        },
        { agents: ['active-agent'] },
      );

      const matchedRes = await client.request({
        method: 'GET',
        path: '/v1/agents',
        headers: { authorization: 'Bearer secret-token' },
        query: { status: 'active' },
      });
      expect(matchedRes.data).toEqual({ agents: ['active-agent'] });

      // If headers do not match, falls back to default
      const unmatchedRes = await client.request({
        method: 'GET',
        path: '/v1/agents',
        headers: { authorization: 'Bearer wrong-token' },
      });
      expect(unmatchedRes.data).toEqual({});
    });

    it('supports body matching in stubs', async () => {
      const client = createMockHttpClient();

      client.stub(
        {
          method: 'POST',
          path: '/v1/payments',
          body: { amount: '100', assetCode: 'XLM' },
        },
        { status: 201, data: { paymentId: 'pay-123' } },
      );

      const res = await client.request({
        method: 'POST',
        path: '/v1/payments',
        body: { amount: '100', assetCode: 'XLM' },
      });
      expect(res.status).toBe(201);
      expect(res.data).toEqual({ paymentId: 'pay-123' });
    });

    it('supports one-time stubs with once: true', async () => {
      const client = createMockHttpClient();

      client.onGet(
        '/v1/retry-test',
        { status: 503, data: 'unavailable' },
        { once: true },
      );
      client.onGet('/v1/retry-test', { status: 200, data: 'recovered' });

      const first = await client.request({
        method: 'GET',
        path: '/v1/retry-test',
      });
      expect(first.status).toBe(503);

      const second = await client.request({
        method: 'GET',
        path: '/v1/retry-test',
      });
      expect(second.status).toBe(200);
      expect(second.data).toBe('recovered');
    });

    it('supports response queue for sequential responses', async () => {
      const client = createMockHttpClient();

      client.queueResponses(
        { status: 200, data: { step: 1 } },
        { status: 200, data: { step: 2 } },
        { status: 200, data: { step: 3 } },
      );

      const r1 = await client.request({ method: 'GET', path: '/step' });
      const r2 = await client.request({ method: 'GET', path: '/step' });
      const r3 = await client.request({ method: 'GET', path: '/step' });
      const r4 = await client.request({ method: 'GET', path: '/step' });

      expect(r1.data).toEqual({ step: 1 });
      expect(r2.data).toEqual({ step: 2 });
      expect(r3.data).toEqual({ step: 3 });
      expect(r4.data).toEqual({}); // default fallback
    });
  });

  describe('Assertion Hook & Spying', () => {
    it('calls assertion hook on every request with recorded details', async () => {
      const seen: RecordedHttpRequest[] = [];
      const client = createMockHttpClient({
        onRequest: (req: RecordedHttpRequest) => {
          seen.push(req);
        },
      });

      await client.request({
        method: 'POST',
        path: '/v1/wallets',
        headers: { 'Content-Type': 'application/json' },
        body: { agentId: 'ag-1' },
      });

      expect(seen).toHaveLength(1);
      expect(seen[0]?.method).toBe('POST');
      expect(seen[0]?.path).toBe('/v1/wallets');
      expect(seen[0]?.headers['Content-Type']).toBe('application/json');
      expect(seen[0]?.body).toEqual({ agentId: 'ag-1' });
      expect(seen[0]?.timestamp).toBeGreaterThan(0);
    });

    it('propagates errors thrown from the assertion hook', async () => {
      const client = createMockHttpClient({
        onRequest: () => {
          throw new Error('Assertion failed: unauthorized path');
        },
      });

      await expect(
        client.request({ method: 'GET', path: '/secret' }),
      ).rejects.toThrow('Assertion failed: unauthorized path');
    });

    it('allows dynamically registering onRequest / onAssert hooks', async () => {
      const hook = vi.fn();
      const client = createMockHttpClient();
      client.onAssert(hook);

      await client.request({ method: 'GET', path: '/test' });
      expect(hook).toHaveBeenCalledTimes(1);
    });
  });

  describe('Assertion Helpers', () => {
    it('assertCalled checks call counts', async () => {
      const client = createMockHttpClient();

      expect(() => client.assertCalled()).toThrow(/at least once/);
      expect(() => client.assertCalled(1)).toThrow(/called 1 time/);
      client.assertNotCalled();

      await client.request({ method: 'GET', path: '/v1/system/health' });
      client.assertCalled();
      client.assertCalled(1);
      expect(() => client.assertNotCalled()).toThrow(/not to be called/);
    });

    it('assertRequest verifies method, path, headers, query, and body', async () => {
      const client = createMockHttpClient();

      await client.request({
        method: 'POST',
        path: '/v1/payments',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'key-123',
        },
        query: { sync: true },
        body: {
          toAddress: 'GABC123',
          amount: { amount: '50.00', assetCode: 'USDC' },
        },
      });

      // Successful assertions
      client.assertLastRequest({
        method: 'POST',
        path: '/v1/payments',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': 'key-123',
        },
        query: { sync: true },
        body: {
          toAddress: 'GABC123',
          amount: { amount: '50.00', assetCode: 'USDC' },
        },
      });

      // Regex matching
      client.assertLastRequest({
        path: /\/v1\/payments/,
        headers: { 'idempotency-key': /^key-/ },
      });

      // Predicate matching
      client.assertLastRequest({
        body: (body: any) => body.toAddress === 'GABC123',
      });

      // Mismatches throw informative errors
      expect(() => client.assertLastRequest({ method: 'GET' })).toThrow(
        /Expected request\[0\]\.method to be "GET", but received "POST"/,
      );

      expect(() => client.assertLastRequest({ path: '/v1/other' })).toThrow(
        /Expected request\[0\]\.path to be "\/v1\/other", but received "\/v1\/payments"/,
      );

      expect(() =>
        client.assertLastRequest({ headers: { 'Missing-Header': 'val' } }),
      ).toThrow(/headers to include header "Missing-Header"/);

      expect(() =>
        client.assertLastRequest({ body: { toAddress: 'WRONG' } }),
      ).toThrow(/body to equal/);
    });

    it('assertCalledWith matches any recorded request', async () => {
      const client = createMockHttpClient();

      await client.request({ method: 'GET', path: '/first' });
      await client.request({ method: 'POST', path: '/second', body: { a: 1 } });
      await client.request({ method: 'GET', path: '/third' });

      const matched = client.assertCalledWith({
        method: 'POST',
        path: '/second',
      });
      expect(matched.body).toEqual({ a: 1 });

      expect(() =>
        client.assertCalledWith({ method: 'DELETE', path: '/unknown' }),
      ).toThrow(/none of the 3 recorded request\(s\) matched/);
    });
  });

  describe('Clearing and Resetting', () => {
    it('clear() removes recorded requests but keeps stubs', async () => {
      const client = createMockHttpClient();
      client.onGet('/data', { val: 42 });

      await client.request({ method: 'GET', path: '/data' });
      expect(client.requests).toHaveLength(1);

      client.clear();
      expect(client.requests).toHaveLength(0);

      // Stubs still work
      const res = await client.request({ method: 'GET', path: '/data' });
      expect(res.data).toEqual({ val: 42 });
    });

    it('reset() clears requests, stubs, and queues', async () => {
      const client = createMockHttpClient();
      client.onGet('/data', { val: 42 });
      client.queueResponse({ val: 99 });

      await client.request({ method: 'GET', path: '/data' });
      client.reset();

      expect(client.requests).toHaveLength(0);
      const res = await client.request({ method: 'GET', path: '/data' });
      expect(res.data).toEqual({}); // fallback default
    });
  });

  describe('Integration with LilySdk', () => {
    it('works as injected HttpClient in LilySdk for full unit test workflows', async () => {
      const mock = createMockHttpClient();

      const mockHealth = {
        status: 'healthy' as const,
        version: '1.0.0',
        network: 'testnet',
        timestamp: '2026-09-01T00:00:00Z',
      };

      const mockAgent = {
        id: 'agent-1',
        name: 'Autonomous Worker',
        network: 'stellar-testnet' as const,
        status: 'active' as const,
        capabilities: ['payments'],
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      };

      mock
        .onGet('/v1/system/health', mockHealth)
        .onGet('/v1/agents', [mockAgent])
        .onGet('/v1/agents/agent-1', mockAgent);

      const sdk = new LilySdk({ baseUrl: 'https://api.lily.test' }, mock);

      const health = await sdk.system.health();
      expect(health).toEqual(mockHealth);

      const agents = await sdk.agents.list();
      expect(agents).toEqual([mockAgent]);

      const agent = await sdk.agents.get('agent-1');
      expect(agent).toEqual(mockAgent);

      mock.assertCalled(3);
      mock.assertRequest({ method: 'GET', path: '/v1/system/health' }, 0);
      mock.assertRequest({ method: 'GET', path: '/v1/agents' }, 1);
      mock.assertRequest({ method: 'GET', path: '/v1/agents/agent-1' }, 2);
    });
  });
});
