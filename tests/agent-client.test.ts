import { describe, expect, it, vi } from 'vitest';

import { AgentClient } from '../src/clients/agent-client';
import type {
  CreateAgentRequest,
  ListAgentsQuery,
  UpdateAgentRequest,
} from '../src/models';
import { createMockHttpClient } from './helpers/mock-http-client';

function createClient() {
  const requestSpy = vi.fn(() =>
    Promise.resolve({
      status: 200,
      headers: new Headers(),
      data: {},
    }),
  );

  return {
    client: new AgentClient(createMockHttpClient(requestSpy)),
    requestSpy,
  };
}

describe('AgentClient', () => {
  it('lists agents with the supplied query', async () => {
    const { client, requestSpy } = createClient();
    const query: ListAgentsQuery = {
      status: 'active',
      limit: 25,
      cursor: 'next-page',
    };

    await client.list(query);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents',
      query,
    });
  });

  it('creates an agent with the supplied body', async () => {
    const { client, requestSpy } = createClient();
    const input: CreateAgentRequest = {
      name: 'Treasury Agent',
      description: 'Manages treasury payments',
      network: 'stellar-testnet',
      capabilities: ['payments'],
      metadata: { environment: 'test' },
    };

    await client.create(input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/agents',
      body: input,
    });
  });

  it('gets an agent by id', async () => {
    const { client, requestSpy } = createClient();

    await client.get('agent-123');

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents/agent-123',
    });
  });

  it('updates an agent with the supplied body', async () => {
    const { client, requestSpy } = createClient();
    const input: UpdateAgentRequest = {
      name: 'Updated Treasury Agent',
      status: 'inactive',
      capabilities: ['payments', 'reporting'],
    };

    await client.update('agent-123', input);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/v1/agents/agent-123',
      body: input,
    });
  });
});
