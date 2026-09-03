import type { HealthStatus, ServiceInfo } from '../models';
import type { SystemClientContract } from '../types/contracts';
import type { ResolvedLilySdkConfig } from '../config/types';
import type { HttpClient } from '../http/types';
import { BaseClient } from './base-client';
import { validateHealthStatus } from '../validation/health-status';

export class SystemClient extends BaseClient implements SystemClientContract {
  private readonly validateResponses: boolean;

  public constructor(httpClientOrConfig: HttpClient | ResolvedLilySdkConfig) {
    super(httpClientOrConfig);
    if ('validateResponses' in httpClientOrConfig) {
      this.validateResponses = (httpClientOrConfig as ResolvedLilySdkConfig).validateResponses ?? false;
    } else {
      this.validateResponses = false;
    }
  }

  public async health(): Promise<HealthStatus> {
    const data = await this.request<HealthStatus>({
      method: 'GET',
      path: '/v1/system/health',
    });
    if (this.validateResponses) {
      return validateHealthStatus(data) as unknown as HealthStatus;
    }
    return data;
  }

  public info(): Promise<ServiceInfo> {
    return this.request({
      method: 'GET',
      path: '/v1/system/info',
    });
  }
}
