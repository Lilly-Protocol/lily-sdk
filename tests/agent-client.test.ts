import { describe, it, expect } from 'vitest';
import { AgentClient } from '../src/clients/agent-client.js';
import type { HttpClient, HttpResponse, HttpRequest } from '../src/http/types.js';
import type { Agent, CreateAgentRequest, UpdateAgentRequest, ListAgentsQuery } from '../src/models/agent.js';

function createMockHttpClient(responses: Record<string, unknown>): HttpClient {
  return {
    request: <TResponse>(input: HttpRequest): Promise<HttpResponse<TResponse>> => {
      const key = `${input.method} ${input.path}`;
      const data = responses[key];
      if (!data) throw new Error(`No mock for ${key}`);
      return Promise.resolve({
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        data: data as TResponse,
      });
    },
  };
}

const mockAgent: Agent = {
  id: 'a1',
  name: 'Test Agent',
  status: 'active',
  network: 'stellar-testnet',
  capabilities: ['read'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AgentClient', () => {
  it('list sends GET /v1/agents with query params', async () => {
    const expected = [mockAgent];
    const http = createMockHttpClient({ 'GET /v1/agents': expected });
    const client = new AgentClient(http);

    const query: ListAgentsQuery = { status: 'active', limit: 10, cursor: 'c1' };
    const result = await client.list(query);

    expect(result).toEqual(expected);
  });

  it('create sends POST /v1/agents with body', async () => {
    const http = createMockHttpClient({ 'POST /v1/agents': mockAgent });
    const client = new AgentClient(http);

    const input: CreateAgentRequest = {
      name: 'Test Agent',
      network: 'stellar-testnet',
      capabilities: ['read'],
    };
    const result = await client.create(input);

    expect(result).toEqual(mockAgent);
  });

  it('get sends GET /v1/agents/:id', async () => {
    const http = createMockHttpClient({ 'GET /v1/agents/a1': mockAgent });
    const client = new AgentClient(http);

    const result = await client.get('a1');
    expect(result).toEqual(mockAgent);
  });

  it('update sends PATCH /v1/agents/:id with body', async () => {
    const updated = { ...mockAgent, name: 'Updated' };
    const http = createMockHttpClient({ 'PATCH /v1/agents/a1': updated });
    const client = new AgentClient(http);

    const input: UpdateAgentRequest = { name: 'Updated' };
    const result = await client.update('a1', input);

    expect(result).toEqual(updated);
  });
});
