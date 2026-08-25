import { describe, expect, it, vi } from 'vitest';

import type { Agent } from '../src/models';
import { LilySdk } from '../src/sdk';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('AgentClient', () => {
  // ─── list ──────────────────────────────────────────────
  it('list sends GET /v1/agents with empty query when no params', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: [
          {
            id: 'agent-001',
            name: 'Alpha Agent',
            status: 'active',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ] as Agent[],
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.agents.list();

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents',
      query: {},
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('agent-001');
    expect(result[0].name).toBe('Alpha Agent');
  });

  it('list sends GET /v1/agents with query params when provided', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: [],
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.agents.list({ status: 'active', limit: 10 });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents',
      query: { status: 'active', limit: 10 },
    });
  });

  it('list return value passthrough from HttpResponse.data', async () => {
    const mockData = [
      { id: 'a-1', name: 'Agent 1', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'a-2', name: 'Agent 2', status: 'inactive', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
    ];

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

    const result = await sdk.agents.list();

    expect(result).toEqual(mockData);
  });

  // ─── get ───────────────────────────────────────────────
  it('get sends GET /v1/agents/:agentId', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'agent-002',
          name: 'Beta Agent',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } as Agent,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.agents.get('agent-002');

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents/agent-002',
    });
    expect(result.id).toBe('agent-002');
    expect(result.name).toBe('Beta Agent');
  });

  it('get passes agent ID into the URL path', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'a-1',
          name: 'Test',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.agents.get('a-1');

    const call = requestSpy.mock.calls[0][0];
    expect(call.method).toBe('GET');
    expect(call.path).toBe('/v1/agents/a-1');
  });

  it('get return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'a-pt',
      name: 'Passthrough Agent',
      status: 'suspended',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-02T00:00:00Z',
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

    const result = await sdk.agents.get('a-pt');

    expect(result).toEqual(mockData);
  });

  // ─── create ─────────────────────────────────────────────
  it('create sends POST /v1/agents with CreateAgentRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: {
          id: 'agent-003',
          name: 'Gamma Agent',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } as Agent,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = { name: 'Gamma Agent' };
    const result = await sdk.agents.create(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/agents',
      body: input,
    });
    expect(result.id).toBe('agent-003');
    expect(result.name).toBe('Gamma Agent');
  });

  it('create return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'a-create',
      name: 'Created Agent',
      status: 'provisioning',
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: mockData,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const result = await sdk.agents.create({ name: 'Created Agent' });

    expect(result).toEqual(mockData);
  });

  // ─── update ─────────────────────────────────────────────
  it('update sends PATCH /v1/agents/:agentId with UpdateAgentRequest body', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'agent-004',
          name: 'Updated Agent',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        } as Agent,
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    const input = { name: 'Updated Agent' };
    const result = await sdk.agents.update('agent-004', input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/v1/agents/agent-004',
      body: input,
    });
    expect(result.id).toBe('agent-004');
    expect(result.name).toBe('Updated Agent');
  });

  it('update passes agent ID into the URL path', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: {
          id: 'a-upd',
          name: 'Updated',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    );

    const sdk = new LilySdk(
      { baseUrl: 'https://api.lily.test', fetch: globalThis.fetch },
      createMockHttpClient(requestSpy),
    );

    await sdk.agents.update('a-upd', { name: 'Updated' });

    const call = requestSpy.mock.calls[0][0];
    expect(call.method).toBe('PATCH');
    expect(call.path).toBe('/v1/agents/a-upd');
  });

  it('update return value passthrough from HttpResponse.data', async () => {
    const mockData = {
      id: 'a-upd2',
      name: 'New Name',
      status: 'inactive',
      createdAt: '2026-01-01T00:00:00Z',
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

    const result = await sdk.agents.update('a-upd2', { name: 'New Name' });

    expect(result).toEqual(mockData);
  });
});
