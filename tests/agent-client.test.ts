import { describe, expect, it, vi } from 'vitest';

import { AgentClient } from '../src/clients/agent-client';
import { LilyValidationError } from '../src/errors/sdk-error';
import type {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '../src/models';
import { createMockHttpClient } from './helpers/mock-http-client';

describe('AgentClient', () => {
  const mockAgent: Agent = {
    id: 'agent_123',
    name: 'Research Agent',
    network: 'stellar-testnet',
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

  it('rejects get when agentId is empty', async () => {
    const requestSpy = vi.fn();
    const client = new AgentClient(createMockHttpClient(requestSpy));

    await expect(client.get('')).rejects.toThrow(LilyValidationError);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  describe('create', () => {
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
        network: 'stellar-testnet',
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

    it('rejects create when name is empty or missing', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(
        client.create({ name: '', network: 'stellar-testnet' }),
      ).rejects.toThrow(LilyValidationError);

      await expect(
        client.create({ name: '   ', network: 'stellar-testnet' }),
      ).rejects.toThrow(LilyValidationError);

      await expect(
        client.create({ network: 'stellar-testnet' } as any),
      ).rejects.toThrow(LilyValidationError);

      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rejects create when network is invalid', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(
        client.create({ name: 'Valid Name', network: 'ethereum' as any }),
      ).rejects.toThrow(LilyValidationError);

      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rejects create when capabilities are invalid', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(
        client.create({
          name: 'Valid Name',
          network: 'stellar-testnet',
          capabilities: ['search', ''] as any,
        }),
      ).rejects.toThrow(LilyValidationError);

      await expect(
        client.create({
          name: 'Valid Name',
          network: 'stellar-testnet',
          capabilities: 'not-an-array' as any,
        }),
      ).rejects.toThrow(LilyValidationError);

      expect(requestSpy).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates an agent by id', async () => {
      const updatedAgent: Agent = {
        ...mockAgent,
        status: 'inactive',
      };

      const requestSpy = vi.fn(() =>
        Promise.resolve({
          status: 200,
          headers: new Headers(),
          data: updatedAgent,
        }),
      );

      const updatePayload: UpdateAgentRequest = {
        status: 'inactive',
      };

      const client = new AgentClient(createMockHttpClient(requestSpy));
      const agent = await client.update('agent_123', updatePayload);

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/v1/agents/agent_123',
        body: updatePayload,
      });
      expect(agent.status).toBe('inactive');
    });

    it('rejects update when agentId is empty', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(client.update('', { status: 'active' })).rejects.toThrow(
        LilyValidationError,
      );
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rejects update when name is empty', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(client.update('agent_123', { name: '' })).rejects.toThrow(
        LilyValidationError,
      );

      await expect(client.update('agent_123', { name: '   ' })).rejects.toThrow(
        LilyValidationError,
      );

      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rejects update when status is invalid', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(
        client.update('agent_123', { status: 'invalid-status' as any }),
      ).rejects.toThrow(LilyValidationError);

      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rejects update when capabilities are invalid', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(
        client.update('agent_123', { capabilities: [''] as any }),
      ).rejects.toThrow(LilyValidationError);

      expect(requestSpy).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('rejects delete when agentId is empty', async () => {
      const requestSpy = vi.fn();
      const client = new AgentClient(createMockHttpClient(requestSpy));

      await expect(client.delete('')).rejects.toThrow(LilyValidationError);
      expect(requestSpy).not.toHaveBeenCalled();
    });
  });
});
