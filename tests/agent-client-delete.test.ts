import { describe, it, expect, vi } from 'vitest';
import { AgentClient } from '../src/clients/agent-client';
import type { HttpClient, HttpResponse } from '../src/http/types';

function createMockClient(): { client: AgentClient; mock: HttpClient } {
  const mock: HttpClient = {
    request: vi.fn().mockResolvedValue({
      status: 204,
      headers: new Headers(),
      data: null,
    } satisfies HttpResponse),
  };
  return { client: new AgentClient(mock), mock };
}

describe('AgentClient.delete (issue #63)', () => {
  it('sends DELETE /v1/agents/:agentId', async () => {
    const { client, mock } = createMockClient();
    await client.delete('agent-123');
    expect(mock.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/v1/agents/agent-123',
    });
  });

  it('passes agent ID into the URL path', async () => {
    const { client, mock } = createMockClient();
    await client.delete('agent-456');
    const call = (mock.request as any).mock.calls[0][0];
    expect(call.path).toBe('/v1/agents/agent-456');
  });

  it('does not send a body', async () => {
    const { client, mock } = createMockClient();
    await client.delete('agent-789');
    const call = (mock.request as any).mock.calls[0][0];
    expect(call.body).toBeUndefined();
  });

  it('returns void on success', async () => {
    const { client } = createMockClient();
    const result = await client.delete('agent-abc');
    expect(result).toBeNull();
  });

  it('uses DELETE method', async () => {
    const { client, mock } = createMockClient();
    await client.delete('agent-xyz');
    const call = (mock.request as any).mock.calls[0][0];
    expect(call.method).toBe('DELETE');
  });
});
