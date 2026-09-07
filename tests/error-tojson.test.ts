import { describe, it, expect } from 'vitest';
import {
  LilySdkError,
  LilyConfigError,
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
  isLilySdkError,
  LILY_ERROR_CODES,
} from '../src/errors/sdk-error';

/**
 * Bounty #60 — $40
 * "Add `toJSON()` and richer `toString()` to `LilySdkError`"
 */
describe('LilySdkError toJSON and toString', () => {
  it('toJSON returns a plain object with error fields', () => {
    const error = new LilyApiError('API failed', {
      code: 'API_ERROR',
      statusCode: 500,
      details: { path: '/v1/test' },
    });
    const json = error.toJSON();
    expect(json).toEqual({
      name: 'LilyApiError',
      message: 'API failed',
      code: 'API_ERROR',
      statusCode: 500,
      details: { path: '/v1/test' },
    });
  });

  it('toString includes name and message', () => {
    const error = new LilyConfigError('Bad config');
    expect(error.toString()).toBe('LilyConfigError: Bad config');
  });

  it('toString includes statusCode when present', () => {
    const error = new LilyApiError('API failed', { statusCode: 429 });
    expect(error.toString()).toContain('429');
  });

  it('toString includes code when present', () => {
    const error = new LilyApiError('API failed', { code: 'RATE_LIMITED' });
    expect(error.toString()).toContain('RATE_LIMITED');
  });

  it('isLilySdkError works with all subclasses', () => {
    expect(isLilySdkError(new LilyConfigError('x'))).toBe(true);
    expect(isLilySdkError(new LilyApiError('x'))).toBe(true);
    expect(isLilySdkError(new LilyAuthenticationError('x'))).toBe(true);
    expect(isLilySdkError(new LilyTransportError('x'))).toBe(true);
    expect(isLilySdkError(new LilySdkError('x'))).toBe(true);
    expect(isLilySdkError(new Error('x'))).toBe(false);
    expect(isLilySdkError('not an error')).toBe(false);
    expect(isLilySdkError(null)).toBe(false);
  });

  it('LILY_ERROR_CODES is frozen', () => {
    expect(Object.isFrozen(LILY_ERROR_CODES)).toBe(true);
  });

  it('LILY_ERROR_CODES has expected values', () => {
    expect(LILY_ERROR_CODES.CONFIG_ERROR).toBe('CONFIG_ERROR');
    expect(LILY_ERROR_CODES.API_ERROR).toBe('API_ERROR');
    expect(LILY_ERROR_CODES.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
    expect(LILY_ERROR_CODES.TRANSPORT_ERROR).toBe('TRANSPORT_ERROR');
    expect(LILY_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(LILY_ERROR_CODES.TIMEOUT).toBe('TIMEOUT');
  });
});
