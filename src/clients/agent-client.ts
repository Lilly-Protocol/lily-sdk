import { encodePathSegment } from '../http/path';
import type {
  Agent,
  CreateAgentRequest,
  ListAgentsQuery,
  UpdateAgentRequest,
} from '../models';
import type { AgentClientContract } from '../types/contracts';
import { BaseClient } from './base-client';

export class AgentClient extends BaseClient implements AgentClientContract {
  public list(query: ListAgentsQuery = {}): Promise<readonly Agent[]> {
    return this.request({
      method: 'GET',
      path: '/v1/agents',
      query: {
        ...query,
      },
    });
  }

  public get(agentId: string): Promise<Agent> {
    return this.request({
      method: 'GET',
      path: `/v1/agents/${encodePathSegment(agentId)}`,
    });
  }

  public create(input: CreateAgentRequest): Promise<Agent> {
    return this.request({
      method: 'POST',
      path: '/v1/agents',
      body: input,
    });
  }

  public update(agentId: string, input: UpdateAgentRequest): Promise<Agent> {
    return this.request({
      method: 'PATCH',
      path: `/v1/agents/${encodePathSegment(agentId)}`,
      body: input,
    });
  }
}
