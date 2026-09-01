import { describe, expect, it, vi } from 'vitest';

import type {
  Agent,
  CreateAgentRequest,
  ListAgentsQuery,
  UpdateAgentRequest,
} from '../src/models';
import { AgentClient } from '../src/clients/agent-client';
import { createMockHttpClient } from './helpers/mock-http-client';

const agent: Agent = {
  id: 'agent-123',
  name: 'Test Agent',
  description: 'A test agent',
  status: 'active',
  network: 'stellar-testnet',
  capabilities: ['payments'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('AgentClient', () => {
  it('sends list queries through GET /v1/agents', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: [agent],
      }),
    );

    const client = new AgentClient(
      createMockHttpClient(requestSpy),
    );

    const query: ListAgentsQuery = {
      status: 'active',
      limit: 10,
      cursor: 'cursor-abc',
    };

    const result = await client.list(query);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents',
      query,
    });
    expect(result).toStrictEqual([agent]);
  });

  it('sends create payloads through POST /v1/agents', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: agent,
      }),
    );

    const client = new AgentClient(
      createMockHttpClient(requestSpy),
    );

    const input: CreateAgentRequest = {
      name: 'Test Agent',
      description: 'A test agent',
      network: 'stellar-testnet',
      capabilities: ['payments'],
      metadata: { key: 'value' },
    };

    const result = await client.create(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/agents',
      body: input,
    });
    expect(result).toStrictEqual(agent);
  });

  it('sends get requests through GET /v1/agents/:id', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: agent,
      }),
    );

    const client = new AgentClient(
      createMockHttpClient(requestSpy),
    );

    const result = await client.get('agent-123');

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents/agent-123',
    });
    expect(result).toStrictEqual(agent);
  });

  it('sends update payloads through PATCH /v1/agents/:id', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: agent,
      }),
    );

    const client = new AgentClient(
      createMockHttpClient(requestSpy),
    );

    const input: UpdateAgentRequest = {
      name: 'Updated Agent',
      capabilities: ['payments', 'staking'],
    };

    const result = await client.update('agent-123', input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/v1/agents/agent-123',
      body: input,
    });
    expect(result).toStrictEqual(agent);
  });
});
