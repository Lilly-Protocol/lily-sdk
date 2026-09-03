import { LilyValidationError } from '../errors/sdk-error';

export interface HealthStatusShape {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  checks: Record<string, 'ok' | 'degraded' | 'down'>;
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
        details: {
          field: 'status',
          received: obj.status,
          valid: VALID_STATUSES,
        },
      },
    );
  }
  if (typeof obj.version !== 'string') {
    throw new LilyValidationError('HealthStatus.version must be a string', {
      code: 'VALIDATION_ERROR',
      details: { field: 'version', received: obj.version },
    });
  }
  if (typeof obj.timestamp !== 'string') {
    throw new LilyValidationError('HealthStatus.timestamp must be a string', {
      code: 'VALIDATION_ERROR',
      details: { field: 'timestamp', received: obj.timestamp },
    });
  }
  if (
    obj.checks === undefined ||
    typeof obj.checks !== 'object' ||
    Array.isArray(obj.checks)
  ) {
    throw new LilyValidationError('HealthStatus.checks must be an object', {
      code: 'VALIDATION_ERROR',
      details: { field: 'checks', received: obj.checks },
    });
  }
  const checks = obj.checks as Record<string, unknown>;
  for (const [key, value] of Object.entries(checks)) {
    if (typeof value !== 'string' || !VALID_STATUSES.includes(value)) {
      throw new LilyValidationError(
        `HealthStatus.checks[${key}] must be one of: ${VALID_STATUSES.join(', ')}`,
        {
          code: 'VALIDATION_ERROR',
          details: {
            field: `checks[${key}]`,
            received: value,
            valid: VALID_STATUSES,
          },
        },
      );
    }
  }
  return obj as unknown as HealthStatusShape;
}
