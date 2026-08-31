import { describe, expect, it } from 'vitest';
import type { HttpRequest } from '../src/http/types';
import type {
  Agent,
  CreateAgentRequest,
  ListAgentsQuery,
  UpdateAgentRequest,
} from '../src/models';
import { AgentClient } from '../src/clients/agent-client';
import { createMockHttpClient } from './helpers/mock-http-client';

const stubAgent: Agent = {
  id: 'agent-1',
  name: 'Test Agent',
  status: 'active',
  network: 'stellar-testnet',
  capabilities: ['transfer'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AgentClient', () => {
  it('list sends GET /v1/agents with query passthrough', async () => {
    let captured: HttpRequest<ListAgentsQuery> | undefined;
    const client = new AgentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<ListAgentsQuery>;
        return { status: 200, data: [stubAgent] };
      }),
    );

    const result = await client.list({
      status: 'active',
      limit: 10,
      cursor: 'abc',
    });

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('GET');
    expect(captured!.path).toBe('/v1/agents');
    expect(captured!.query).toEqual({
      status: 'active',
      limit: 10,
      cursor: 'abc',
    });
    expect(result).toEqual([stubAgent]);
  });

  it('get sends GET /v1/agents/:id', async () => {
    let captured: HttpRequest<undefined> | undefined;
    const client = new AgentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<undefined>;
        return { status: 200, data: stubAgent };
      }),
    );

    const result = await client.get('agent-1');

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('GET');
    expect(captured!.path).toBe('/v1/agents/agent-1');
    expect(result).toEqual(stubAgent);
  });

  it('create sends POST /v1/agents with body', async () => {
    let captured: HttpRequest<CreateAgentRequest> | undefined;
    const input: CreateAgentRequest = {
      name: 'New Agent',
      network: 'stellar-mainnet',
      capabilities: ['mint'],
    };
    const client = new AgentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<CreateAgentRequest>;
        return { status: 200, data: { ...stubAgent, ...input } };
      }),
    );

    const result = await client.create(input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('POST');
    expect(captured!.path).toBe('/v1/agents');
    expect(captured!.body).toEqual(input);
    expect(result.name).toBe('New Agent');
  });

  it('update sends PATCH /v1/agents/:id with body', async () => {
    let captured: HttpRequest<UpdateAgentRequest> | undefined;
    const input: UpdateAgentRequest = { name: 'Updated', status: 'inactive' };
    const client = new AgentClient(
      createMockHttpClient(async (request) => {
        captured = request as HttpRequest<UpdateAgentRequest>;
        return { status: 200, data: { ...stubAgent, ...input } };
      }),
    );

    const result = await client.update('agent-1', input);

    expect(captured).toBeDefined();
    expect(captured!.method).toBe('PATCH');
    expect(captured!.path).toBe('/v1/agents/agent-1');
    expect(captured!.body).toEqual(input);
    expect(result.status).toBe('inactive');
  });
});
