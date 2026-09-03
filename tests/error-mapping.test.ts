import { describe, it, expect } from 'vitest';
import { LilyApiError, LilyAuthenticationError, LilyTransportError, LilySdkError, isLilySdkError } from '../src/errors/sdk-error';

describe('Error mapping 4xx/5xx (issue #7)', () => {
  it('LilyApiError is thrown for 4xx/5xx responses', () => {
    const error = new LilyApiError('Server error', { code: 'API_ERROR', statusCode: 500 });
    expect(error).toBeInstanceOf(LilySdkError);
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('API_ERROR');
  });

  it('LilyAuthenticationError is thrown for 401/403', () => {
    const error = new LilyAuthenticationError('Unauthorized', { statusCode: 401 });
    expect(error).toBeInstanceOf(LilySdkError);
    expect(error.statusCode).toBe(401);
  });

  it('LilyTransportError is thrown for network failures', () => {
    const cause = new Error('ECONNREFUSED');
    const error = new LilyTransportError('Connection failed', { cause });
    expect(error).toBeInstanceOf(LilySdkError);
    expect(error.cause).toBe(cause);
  });

  it('isLilySdkError type guard works', () => {
    const apiError = new LilyApiError('fail', { code: 'ERR', statusCode: 500 });
    const plainError = new Error('plain');
    expect(isLilySdkError(apiError)).toBe(true);
    expect(isLilySdkError(plainError)).toBe(false);
  });
});
