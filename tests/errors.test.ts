import { describe, expect, it } from 'vitest';

import {
  LilyApiError,
  LilyAuthenticationError,
  LilyConfigError,
  LilySdkError,
  LilyTransportError,
  LilyValidationError,
} from '../src/errors/sdk-error';

describe('LilySdkError', () => {
  describe('toJSON()', () => {
    it('returns name and message for a basic error', () => {
      const error = new LilySdkError('Something went wrong');
      const json = error.toJSON();

      expect(json.name).toBe('LilySdkError');
      expect(json.message).toBe('Something went wrong');
      expect(json).not.toHaveProperty('code');
      expect(json).not.toHaveProperty('statusCode');
      expect(json).not.toHaveProperty('details');
      expect(json).not.toHaveProperty('cause');
    });

    it('includes code, statusCode, and details when provided', () => {
      const error = new LilyApiError('Request failed', {
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        details: { endpoint: '/v1/payments' },
      });

      const json = error.toJSON();

      expect(json.name).toBe('LilyApiError');
      expect(json.message).toBe('Request failed');
      expect(json.code).toBe('INTERNAL_ERROR');
      expect(json.statusCode).toBe(500);
      expect(json.details).toEqual({ endpoint: '/v1/payments' });
    });

    it('recursively serializes nested LilySdkError cause', () => {
      const inner = new LilyTransportError('Connection refused', {
        code: 'CONN_REFUSED',
        statusCode: 503,
      });
      const outer = new LilyApiError('Request failed', { cause: inner });

      const json = outer.toJSON();

      expect(json.cause).toEqual({
        name: 'LilyTransportError',
        message: 'Connection refused',
        code: 'CONN_REFUSED',
        statusCode: 503,
      });
    });

    it('serializes plain Error cause as name and message only', () => {
      const inner = new Error('Native error');
      const outer = new LilySdkError('Wrapper error', { cause: inner });

      const json = outer.toJSON();

      expect(json.cause).toEqual({
        name: 'Error',
        message: 'Native error',
      });
    });

    it('serializes non-Error cause as-is', () => {
      const outer = new LilySdkError('Wrapper', { cause: { foo: 'bar' } });

      const json = outer.toJSON();

      expect(json.cause).toEqual({ foo: 'bar' });
    });

    it('does not include cause when undefined', () => {
      const error = new LilySdkError('No cause');
      const json = error.toJSON();

      expect(json).not.toHaveProperty('cause');
    });

    it('produces valid JSON via JSON.stringify', () => {
      const error = new LilyApiError('Boom', {
        code: 'ERR_X',
        statusCode: 400,
        details: { key: 'value' },
      });

      const str = JSON.stringify(error);
      const parsed = JSON.parse(str);

      expect(parsed.name).toBe('LilyApiError');
      expect(parsed.message).toBe('Boom');
      expect(parsed.code).toBe('ERR_X');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.details).toEqual({ key: 'value' });
    });

    it('preserves subclass name', () => {
      const authError = new LilyAuthenticationError('Unauthorized', {
        code: 'AUTH_FAILED',
        statusCode: 401,
      });

      expect(authError.toJSON().name).toBe('LilyAuthenticationError');
    });
  });

  describe('toString()', () => {
    it('returns name and message for a basic error', () => {
      const error = new LilySdkError('Something broke');
      expect(error.toString()).toBe('LilySdkError: Something broke');
    });

    it('includes code and statusCode when present', () => {
      const error = new LilyApiError('Request failed', {
        code: 'TIMEOUT',
        statusCode: 408,
      });

      expect(error.toString()).toBe(
        'LilyApiError: Request failed: [TIMEOUT]: (HTTP 408)',
      );
    });

    it('includes only code when statusCode is absent', () => {
      const error = new LilyValidationError('Invalid input', {
        code: 'INVALID_AMOUNT',
      });

      expect(error.toString()).toBe(
        'LilyValidationError: Invalid input: [INVALID_AMOUNT]',
      );
    });

    it('includes only statusCode when code is absent', () => {
      const error = new LilyConfigError('Bad config', { statusCode: 500 });

      expect(error.toString()).toBe('LilyConfigError: Bad config: (HTTP 500)');
    });

    it('preserves subclass name', () => {
      const error = new LilyTransportError('Network down');
      expect(error.toString()).toContain('LilyTransportError');
    });
  });

  describe('subclass inheritance', () => {
    it('all subclasses inherit toJSON and toString', () => {
      const subclasses = [
        { cls: LilyConfigError, name: 'LilyConfigError' },
        { cls: LilyTransportError, name: 'LilyTransportError' },
        { cls: LilyValidationError, name: 'LilyValidationError' },
        { cls: LilyAuthenticationError, name: 'LilyAuthenticationError' },
        { cls: LilyApiError, name: 'LilyApiError' },
      ];

      for (const { cls, name } of subclasses) {
        const instance = new cls('test message', {
          code: 'TEST_CODE',
          statusCode: 400,
        });
        expect(instance.toJSON().name).toBe(name);
        expect(instance.toString()).toContain(name);
        expect(instance.toString()).toContain('[TEST_CODE]');
        expect(instance.toString()).toContain('(HTTP 400)');
      }
    });
  });
});
