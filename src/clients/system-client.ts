import type { HealthStatus, ServiceInfo } from '../models';
import type { SystemClientContract } from '../types/contracts';
import type { ResolvedLilySdkConfig } from '../config/types';
import type { HttpClient } from '../http/types';
import { BaseClient } from './base-client';
import { validateHealthStatus } from '../validation/health-status';

export interface SystemClientOptions {
  /**
   * Whether to validate response payloads against known models at runtime.
   * If not specified and httpClientOrConfig is a config object, reads config.validateResponses.
   * Otherwise defaults to false.
   */
  validateResponses?: boolean;
}

export class SystemClient extends BaseClient implements SystemClientContract {
  private readonly validateResponses: boolean;

  public constructor(
    httpClientOrConfig: HttpClient | ResolvedLilySdkConfig,
    optionsOrValidateResponses?: SystemClientOptions | boolean,
  ) {
    super(httpClientOrConfig);
    // BaseClient stores config when passed a ResolvedLilySdkConfig, or httpClient when passed an HttpClient
    // When sdk.ts passes config, this.config is set and we read validateResponses from it
    // When passed an HttpClient directly, this.config is undefined, so default to false
    this.validateResponses = this.config?.validateResponses ?? false;
  }

  public async health(): Promise<HealthStatus> {
    const data = await this.request<HealthStatus>({
      method: 'GET',
      path: '/v1/system/health',
    });
    if (this.validateResponses) {
      return validateHealthStatus(data);
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
