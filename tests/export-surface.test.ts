import { describe, expect, it } from 'vitest';

import * as mainExports from '../src/index';
import * as errorExports from '../src/errors';

describe('public export surface', () => {
  it('does not advertise the unused LilyValidationError', () => {
    expect(mainExports).not.toHaveProperty('LilyValidationError');
    expect(errorExports).not.toHaveProperty('LilyValidationError');
  });
});
