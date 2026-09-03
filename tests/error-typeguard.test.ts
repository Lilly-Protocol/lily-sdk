import { describe, it, expect } from 'vitest';
import { isLilySdkError, LILY_ERROR_CODES } from '../src/errors/sdk-error';
import {
  LilySdkError,
  LilyConfigError,
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
  LilyValidationError,
} from '../src/errors/sdk-error';

describe('isLilySdkError type guard', () => {
  it('returns true for LilySdkError instances', () => {
    expect(isLilySdkError(new LilySdkError('test'))).toBe(true);
  });

  it('returns true for subclass instances', () => {
    expect(isLilySdkError(new LilyConfigError('test'))).toBe(true);
    expect(isLilySdkError(new LilyApiError('test'))).toBe(true);
    expect(isLilySdkError(new LilyAuthenticationError('test'))).toBe(true);
    expect(isLilySdkError(new LilyTransportError('test'))).toBe(true);
    expect(isLilySdkError(new LilyValidationError('test'))).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isLilySdkError(new Error('test'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isLilySdkError(null)).toBe(false);
    expect(isLilySdkError(undefined)).toBe(false);
    expect(isLilySdkError('string')).toBe(false);
    expect(isLilySdkError(42)).toBe(false);
    expect(isLilySdkError({ message: 'fake' })).toBe(false);
  });

  it('returns false for objects that look like errors but are not', () => {
    const fake = { name: 'LilySdkError', message: 'fake' };
    expect(isLilySdkError(fake)).toBe(false);
  });
});

describe('LILY_ERROR_CODES constants', () => {
  it('defines all expected error codes', () => {
    expect(LILY_ERROR_CODES.CONFIG_ERROR).toBe('CONFIG_ERROR');
    expect(LILY_ERROR_CODES.API_ERROR).toBe('API_ERROR');
    expect(LILY_ERROR_CODES.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
    expect(LILY_ERROR_CODES.TRANSPORT_ERROR).toBe('TRANSPORT_ERROR');
    expect(LILY_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(LILY_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
  });

  it('is frozen/immutable', () => {
    expect(Object.isFrozen(LILY_ERROR_CODES)).toBe(true);
  });
});
