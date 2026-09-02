import { LilyValidationError } from '../errors/sdk-error';

export interface HealthStatusShape {
  status: string;
  version?: string;
  uptime?: number;
}

const VALID_STATUSES = ['ok', 'degraded', 'down'];

export function validateHealthStatus(data: unknown): HealthStatusShape {
  if (data === null || typeof data !== 'object') {
    throw new LilyValidationError('HealthStatus must be a non-null object', {
      code: 'VALIDATION_ERROR',
      details: { received: data },
    });
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.status !== 'string') {
    throw new LilyValidationError('HealthStatus.status must be a string', {
      code: 'VALIDATION_ERROR',
      details: { field: 'status', received: obj.status },
    });
  }

  if (!VALID_STATUSES.includes(obj.status)) {
    throw new LilyValidationError(
      `HealthStatus.status must be one of: ${VALID_STATUSES.join(', ')}`,
      {
        code: 'VALIDATION_ERROR',
        details: { field: 'status', received: obj.status, valid: VALID_STATUSES },
      },
    );
  }

  if (obj.version !== undefined && typeof obj.version !== 'string') {
    throw new LilyValidationError('HealthStatus.version must be a string if present', {
      code: 'VALIDATION_ERROR',
      details: { field: 'version', received: obj.version },
    });
  }

  if (obj.uptime !== undefined && typeof obj.uptime !== 'number') {
    throw new LilyValidationError('HealthStatus.uptime must be a number if present', {
      code: 'VALIDATION_ERROR',
      details: { field: 'uptime', received: obj.uptime },
    });
  }

  return obj as unknown as HealthStatusShape;
}
