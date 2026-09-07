import type { ResolvedLilySdkConfig } from '../config/types';

export function toBearer(token: string): string {
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}

export function resolveAuthHeaders(
  config: ResolvedLilySdkConfig,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.apiKey !== undefined) {
    headers['x-api-key'] = config.apiKey;
  }

  if (config.authToken !== undefined) {
    headers.authorization = toBearer(config.authToken);
  }

  return headers;
}
