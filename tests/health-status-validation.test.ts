import { describe, it, expect } from 'vitest';
import { validateHealthStatus } from '../src/validation/health-status';
import { LilyValidationError } from '../src/errors/sdk-error';

describe('validateHealthStatus', () => {
  describe('non-null object validation', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['number', 123],
      ['string', 'healthy'],
      ['boolean', true],
    ])('throws LilyValidationError when data is %s', (_label, value) => {
      expect(() => validateHealthStatus(value)).toThrow(LilyValidationError);
      try {
        validateHealthStatus(value);
      } catch (err) {
        expect(err).toBeInstanceOf(LilyValidationError);
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe('HealthStatus must be a non-null object');
      }
    });
  });

  describe('status field validation', () => {
    it('throws when status is missing', () => {
      expect(() => validateHealthStatus({})).toThrow(LilyValidationError);
      try {
        validateHealthStatus({});
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe('HealthStatus.status must be a string');
      }
    });

    it.each([
      ['number', 1],
      ['null', null],
      ['boolean', false],
      ['object', {}],
    ])('throws when status is %s', (_label, value) => {
      expect(() => validateHealthStatus({ status: value })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: value });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe('HealthStatus.status must be a string');
      }
    });

    it.each(['healthy', 'unknown', 'UP', 'DOWN', 'ready', ''])(
      'throws when status is an unrecognized string "%s"',
      (status) => {
        expect(() => validateHealthStatus({ status })).toThrow(
          LilyValidationError,
        );
        try {
          validateHealthStatus({ status });
        } catch (err) {
          const valErr = err as LilyValidationError;
          expect(valErr.code).toBe('VALIDATION_ERROR');
          expect(valErr.message).toBe(
            'HealthStatus.status must be one of: ok, degraded, down',
          );
        }
      },
    );
  });

  describe('version field validation', () => {
    it.each([
      ['number', 100],
      ['boolean', true],
      ['object', {}],
      ['array', ['1.0.0']],
    ])('throws when version is present but is %s', (_label, version) => {
      expect(() => validateHealthStatus({ status: 'ok', version })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: 'ok', version });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe(
          'HealthStatus.version must be a string if present',
        );
      }
    });
  });

  describe('uptime field validation', () => {
    it.each([
      ['string', '3600'],
      ['boolean', true],
      ['object', {}],
      ['null', null],
    ])('throws when uptime is present but is %s', (_label, uptime) => {
      expect(() => validateHealthStatus({ status: 'ok', uptime })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: 'ok', uptime });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe(
          'HealthStatus.uptime must be a number if present',
        );
      }
    });
  });

  describe('timestamp field validation', () => {
    it.each([
      ['number', 123456],
      ['boolean', true],
      ['object', {}],
      ['null', null],
    ])('throws when timestamp is present but is %s', (_label, timestamp) => {
      expect(() => validateHealthStatus({ status: 'ok', timestamp })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: 'ok', timestamp });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe(
          'HealthStatus.timestamp must be a string if present',
        );
      }
    });
  });

  describe('checks field validation', () => {
    it.each([
      ['string', 'all-good'],
      ['number', 1],
      ['boolean', true],
      ['array', ['ok']],
      ['null', null],
    ])('throws when checks is present but is %s', (_label, checks) => {
      expect(() => validateHealthStatus({ status: 'ok', checks })).toThrow(
        LilyValidationError,
      );
      try {
        validateHealthStatus({ status: 'ok', checks });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe(
          'HealthStatus.checks must be an object if present',
        );
      }
    });

    it('throws when a check value has an invalid status', () => {
      expect(() =>
        validateHealthStatus({
          status: 'ok',
          checks: { database: 'ok', redis: 'broken' },
        }),
      ).toThrow(LilyValidationError);
      try {
        validateHealthStatus({
          status: 'ok',
          checks: { database: 'ok', redis: 'broken' },
        });
      } catch (err) {
        const valErr = err as LilyValidationError;
        expect(valErr.code).toBe('VALIDATION_ERROR');
        expect(valErr.message).toBe(
          'HealthStatus.checks["redis"] must be one of: ok, degraded, down',
        );
      }
    });
  });

  describe('valid payloads', () => {
    it.each(['ok', 'degraded', 'down'] as const)(
      'passes and returns valid status "%s"',
      (status) => {
        const payload = { status };
        const result = validateHealthStatus(payload);
        expect(result).toEqual({ status });
      },
    );

    it('passes with optional version and uptime', () => {
      const payload = {
        status: 'ok',
        version: '1.2.3',
        uptime: 86400,
      };
      const result = validateHealthStatus(payload);
      expect(result).toEqual(payload);
    });

    it('passes with optional timestamp and checks (reconciled model)', () => {
      const payload = {
        status: 'ok',
        version: '1.2.3',
        uptime: 86400,
        timestamp: '2026-09-03T11:00:00.000Z',
        checks: {
          database: 'ok',
          cache: 'ok',
          stellar: 'degraded',
        } as const,
      };
      const result = validateHealthStatus(payload);
      expect(result).toEqual(payload);
    });

    it('passes when optional fields are explicitly undefined', () => {
      const payload = {
        status: 'degraded',
        version: undefined,
        uptime: undefined,
        timestamp: undefined,
        checks: undefined,
      };
      const result = validateHealthStatus(payload);
      expect(result).toEqual(payload);
    });
  });
});
