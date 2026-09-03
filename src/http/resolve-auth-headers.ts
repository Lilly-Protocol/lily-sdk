import type { ResolvedLilySdkConfig } from '../config/types';
import type { HttpHeaders } from './types';

export function resolveAuthHeaders(config: ResolvedLilySdkConfig): HttpHeaders {
  const headers: HttpHeaders = {};

  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  if (config.authToken) {
    headers.authorization = `Bearer ${config.authToken}`;
  }

  return headers;
}
