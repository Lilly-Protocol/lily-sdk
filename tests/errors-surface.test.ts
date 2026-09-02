import { describe, it, expect } from 'vitest';
import * as errors from '../src/errors/sdk-error';

describe('error exports surface', () => {
  it('does not export unused LilyValidationError', () => {
    expect(Object.prototype.hasOwnProperty.call(errors, 'LilyValidationError')).toBe(false);
  });

  it('exports core error classes', () => {
    expect(errors.LilySdkError).toBeDefined();
    expect(errors.LilyConfigError).toBeDefined();
    expect(errors.LilyTransportError).toBeDefined();
    expect(errors.LilyAuthenticationError).toBeDefined();
    expect(errors.LilyApiError).toBeDefined();
  });
});
