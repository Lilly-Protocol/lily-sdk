import { describe, expect, it } from 'vitest';

import {
  LILY_ERROR_CODES,
  LilySdkError,
  isLilySdkError,
} from '../src/errors/sdk-error';

describe('SDK errors', () => {
  it('exports stable error code constants', () => {
    expect(LILY_ERROR_CODES).toEqual({
      API_ERROR: 'API_ERROR',
      AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
      TIMEOUT: 'TIMEOUT',
      TRANSPORT_ERROR: 'TRANSPORT_ERROR',
    });
  });

  it('identifies and narrows LilySdkError values', () => {
    const value: unknown = new LilySdkError('Request failed', {
      code: LILY_ERROR_CODES.API_ERROR,
    });

    expect(isLilySdkError(value)).toBe(true);
    expect(isLilySdkError(new Error('Other error'))).toBe(false);
    expect(isLilySdkError({ name: 'LilySdkError' })).toBe(false);
    expect(isLilySdkError(null)).toBe(false);

    if (isLilySdkError(value)) {
      const narrowed: LilySdkError = value;
      expect(narrowed.code).toBe(LILY_ERROR_CODES.API_ERROR);
    }
  });
});
