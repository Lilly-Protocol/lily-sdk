import { describe, expect, it } from 'vitest';
import * as root from '../src/index';
import * as errors from '../src/errors';

const rootErrorExports = [
  'LILY_ERROR_CODES',
  'LilySdkError',
  'LilyConfigError',
  'LilyApiError',
  'LilyAuthenticationError',
  'LilyAuthorizationError',
  'LilyConflictError',
  'LilyNotFoundError',
  'LilyRateLimitError',
  'LilyServerError',
  'LilyTransportError',
  'LilyValidationError',
  'isLilySdkError',
] as const;

describe('errors subpath parity', () => {
  it.each(rootErrorExports)(
    'exports %s with the same value as the root',
    (name) => {
      expect(errors).toHaveProperty(name);
      expect(errors[name]).toBe(root[name]);
    },
  );
});
