import { describe, expect, it, vi } from 'vitest';

import { AgentClient } from '../src/clients/agent-client';
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '../src/models';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('AgentClient', () => {
  const mockAgent: Agent = {
    id: 'agent_123',
    name: 'Research Agent',
    status: 'active',
    capabilities: ['search', 'analyze'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  it('lists agents with query parameters', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: [mockAgent],
      }),
    );

    const client = new AgentClient(createMockHttpClient(requestSpy));
    const agents = await client.list({ limit: 10, status: 'active' });

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents',
      query: {
        limit: 10,
        status: 'active',
      },
    });
    expect(agents).toEqual([mockAgent]);
  });

  it('gets an agent by id', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: mockAgent,
      }),
    );

    const client = new AgentClient(createMockHttpClient(requestSpy));
    const agent = await client.get('agent_123');

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/agents/agent_123',
    });
    expect(agent).toEqual(mockAgent);
  });

  it('creates an agent with payload', async () => {
    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 201,
        headers: new Headers(),
        data: mockAgent,
      }),
    );

    const createPayload: CreateAgentRequest = {
      name: 'Research Agent',
      capabilities: ['search', 'analyze'],
    };

    const client = new AgentClient(createMockHttpClient(requestSpy));
    const agent = await client.create(createPayload);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/agents',
      body: createPayload,
    });
    expect(agent).toEqual(mockAgent);
  });

  it('updates an agent by id', async () => {
    const updatedAgent: Agent = {
      ...mockAgent,
      status: 'paused',
    };

    const requestSpy = vi.fn(() =>
      Promise.resolve({
        status: 200,
        headers: new Headers(),
        data: updatedAgent,
      }),
    );

    const updatePayload: UpdateAgentRequest = {
      status: 'paused',
    };

    const client = new AgentClient(createMockHttpClient(requestSpy));
    const agent = await client.update('agent_123', updatePayload);

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/v1/agents/agent_123',
      body: updatePayload,
    });
    expect(agent.status).toBe('paused');
  });
});
