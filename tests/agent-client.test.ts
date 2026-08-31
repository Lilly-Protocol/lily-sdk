import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentClient } from '../src/clients/agent-client';
import type { HttpClient, HttpResponse } from '../src/http/types';
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '../src/models';

function createMockHttpClient(responseData: unknown = {}): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: responseData,
    } as HttpResponse),
  };
}

const mockAgent: Agent = {
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent',
  status: 'active',
  network: 'stellar-testnet',
  capabilities: ['payments'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AgentClient', () => {
  let httpClient: HttpClient;
  let client: AgentClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    client = new AgentClient(httpClient);
  });

  describe('list', () => {
    it('sends GET /v1/agents with no query when called without arguments', async () => {
      const agents = [mockAgent];
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: agents,
      } as HttpResponse);

      const result = await client.list();

      expect(result).toEqual(agents);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/agents',
        query: {},
      });
    });

    it('passes query parameters to GET /v1/agents', async () => {
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: [],
      } as HttpResponse);

      await client.list({ status: 'active', limit: 10, offset: 5 });

      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/agents',
        query: { status: 'active', limit: 10, offset: 5 },
      });
    });
  });

  describe('get', () => {
    it('sends GET /v1/agents/:id and returns the agent', async () => {
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: mockAgent,
      } as HttpResponse);

      const result = await client.get('agent-1');

      expect(result).toEqual(mockAgent);
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/agents/agent-1',
      });
    });
  });

  describe('create', () => {
    it('sends POST /v1/agents with the input body', async () => {
      const input: CreateAgentRequest = {
        name: 'New Agent',
        network: 'stellar-mainnet',
        capabilities: ['identity'],
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 201,
        headers: new Headers(),
        data: { ...mockAgent, ...input },
      } as HttpResponse);

      const result = await client.create(input);

      expect(result.name).toBe('New Agent');
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/agents',
        body: input,
      });
    });
  });

  describe('update', () => {
    it('sends PATCH /v1/agents/:id with the update body', async () => {
      const input: UpdateAgentRequest = {
        name: 'Updated Name',
        status: 'inactive',
      };
      vi.mocked(httpClient.request).mockResolvedValueOnce({
        status: 200,
        headers: new Headers(),
        data: { ...mockAgent, ...input },
      } as HttpResponse);

      const result = await client.update('agent-1', input);

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('inactive');
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/v1/agents/agent-1',
        body: input,
      });
    });
  });
});
