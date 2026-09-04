import { describe, it, expect } from 'vitest';
import * as errors from '../src/errors';

describe('error exports surface', () => {
  it('exports LilyValidationError', () => {
    expect(
      Object.prototype.hasOwnProperty.call(errors, 'LilyValidationError'),
    ).toBe(true);
  });

  it('exports isLilySdkError type guard', () => {
    expect(Object.prototype.hasOwnProperty.call(errors, 'isLilySdkError')).toBe(
      true,
    );
  });

  it('exports core error classes', () => {
    expect(errors.LilySdkError).toBeDefined();
    expect(errors.LilyConfigError).toBeDefined();
    expect(errors.LilyTransportError).toBeDefined();
    expect(errors.LilyAuthenticationError).toBeDefined();
    expect(errors.LilyApiError).toBeDefined();
  });
});
