import { describe, expect, it } from 'vitest';

import * as sdk from '../src/index';

describe('public export surface', () => {
  it('does not export unused LilyValidationError', () => {
    expect(Object.prototype.hasOwnProperty.call(sdk, 'LilyValidationError')).toBe(false);
  });

  it('exports core error classes', () => {
    expect(sdk.LilySdkError).toBeDefined();
    expect(sdk.LilyConfigError).toBeDefined();
    expect(sdk.LilyApiError).toBeDefined();
    expect(sdk.LilyAuthenticationError).toBeDefined();
    expect(sdk.LilyTransportError).toBeDefined();
  });
});
