import type { ResolvedLilySdkConfig } from '../config/types';

/**
 * Serializes resolved auth configuration into a HeadersInit-compatible object.
 *
 * Returns only the auth-related headers (`x-api-key` and/or `Authorization`).
 * Other headers (accept, content-type, user-agent, defaultHeaders) are handled
 * separately by the transport layer.
 */
export function toHeaders(
  config: ResolvedLilySdkConfig,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  if (config.authToken) {
    headers.authorization = `Bearer ${config.authToken}`;
  }

  return headers;
}
