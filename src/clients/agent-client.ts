import { encodePathSegment } from '../http/path';
import type {
  Agent,
  CreateAgentRequest,
  ListAgentsQuery,
  UpdateAgentRequest,
} from '../models';
import type { AgentClientContract } from '../types/contracts';
import {
  validateCreateAgentRequest,
  validateNonEmptyString,
  validateUpdateAgentRequest,
} from '../validation';
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

  public async get(agentId: string): Promise<Agent> {
    validateNonEmptyString(agentId, 'agentId');
    return this.request({
      method: 'GET',
      path: `/v1/agents/${encodePathSegment(agentId)}`,
    });
  }

  public async create(input: CreateAgentRequest): Promise<Agent> {
    validateCreateAgentRequest(input);
    return this.request({
      method: 'POST',
      path: '/v1/agents',
      body: input,
    });
  }

  public async update(
    agentId: string,
    input: UpdateAgentRequest,
  ): Promise<Agent> {
    validateNonEmptyString(agentId, 'agentId');
    validateUpdateAgentRequest(input);
    return this.request({
      method: 'PATCH',
      path: `/v1/agents/${encodePathSegment(agentId)}`,
      body: input,
    });
  }

  public async delete(agentId: string): Promise<void> {
    validateNonEmptyString(agentId, 'agentId');
    return this.request({
      method: 'DELETE',
      path: `/v1/agents/${encodePathSegment(agentId)}`,
    });
  }
}
