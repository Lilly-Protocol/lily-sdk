import { LilyValidationError } from '../errors/sdk-error';
import type { HealthStatus } from '../models/system';

export type HealthStatusShape = HealthStatus;

const VALID_STATUSES = ['ok', 'degraded', 'down'] as const;

export function validateHealthStatus(data: unknown): HealthStatus {
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

  if (!VALID_STATUSES.includes(obj.status as (typeof VALID_STATUSES)[number])) {
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

  if (obj.version !== undefined && typeof obj.version !== 'string') {
    throw new LilyValidationError(
      'HealthStatus.version must be a string if present',
      {
        code: 'VALIDATION_ERROR',
        details: { field: 'version', received: obj.version },
      },
    );
  }

  if (obj.uptime !== undefined && typeof obj.uptime !== 'number') {
    throw new LilyValidationError(
      'HealthStatus.uptime must be a number if present',
      {
        code: 'VALIDATION_ERROR',
        details: { field: 'uptime', received: obj.uptime },
      },
    );
  }

  if (obj.timestamp !== undefined && typeof obj.timestamp !== 'string') {
    throw new LilyValidationError(
      'HealthStatus.timestamp must be a string if present',
      {
        code: 'VALIDATION_ERROR',
        details: { field: 'timestamp', received: obj.timestamp },
      },
    );
  }

  if (obj.checks !== undefined) {
    if (
      obj.checks === null ||
      typeof obj.checks !== 'object' ||
      Array.isArray(obj.checks)
    ) {
      throw new LilyValidationError(
        'HealthStatus.checks must be an object if present',
        {
          code: 'VALIDATION_ERROR',
          details: { field: 'checks', received: obj.checks },
        },
      );
    }
    for (const [key, checkVal] of Object.entries(
      obj.checks as Record<string, unknown>,
    )) {
      if (
        typeof checkVal !== 'string' ||
        !VALID_STATUSES.includes(checkVal as (typeof VALID_STATUSES)[number])
      ) {
        throw new LilyValidationError(
          `HealthStatus.checks["${key}"] must be one of: ${VALID_STATUSES.join(', ')}`,
          {
            code: 'VALIDATION_ERROR',
            details: {
              field: `checks.${key}`,
              received: checkVal,
              valid: VALID_STATUSES,
            },
          },
        );
      }
    }
  }

  return obj as unknown as HealthStatus;
}
