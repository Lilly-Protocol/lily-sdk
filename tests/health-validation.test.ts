import { describe, it, expect } from 'vitest';
import { validateHealthStatus } from '../src/validation/health-status';
import { LilyValidationError } from '../src/errors/sdk-error';
import { SystemClient } from '../src/clients/system-client';
import { resolveLilySdkConfig } from '../src/config/types';
import { vi } from 'vitest';

describe('validateHealthStatus (issue #422)', () => {
  it('passes through a valid HealthStatus payload unchanged', () => {
    const data = { status: 'ok', version: '1.0.0', uptime: 42 };
    const result = validateHealthStatus(data);
    expect(result).toEqual(data);
  });

  it('throws VALIDATION_ERROR for null input', () => {
    expect(() => validateHealthStatus(null)).toThrow(LilyValidationError);
    expect(() => validateHealthStatus(null)).toThrow('VALIDATION_ERROR');
  });

  it('throws VALIDATION_ERROR for non-object input', () => {
    expect(() => validateHealthStatus('string')).toThrow(LilyValidationError);
    expect(() => validateHealthStatus(42)).toThrow(LilyValidationError);
    expect(() => validateHealthStatus(undefined)).toThrow(LilyValidationError);
  });

  it('throws VALIDATION_ERROR when status is missing', () => {
    expect(() => validateHealthStatus({ version: '1.0' })).toThrow('status');
  });

  it('throws VALIDATION_ERROR when status is not a string', () => {
    expect(() => validateHealthStatus({ status: 123 })).toThrow('status must be a string');
  });

  it('throws VALIDATION_ERROR for unknown status values', () => {
    expect(() => validateHealthStatus({ status: 'unknown' })).toThrow('one of');
  });

  it('throws VALIDATION_ERROR when version is not a string', () => {
    expect(() => validateHealthStatus({ status: 'ok', version: 123 })).toThrow('version');
  });

  it('throws VALIDATION_ERROR when uptime is not a number', () => {
    expect(() => validateHealthStatus({ status: 'ok', uptime: 'fourty-two' })).toThrow('uptime');
  });

  it('accepts status "ok"', () => {
    expect(validateHealthStatus({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it('accepts status "degraded"', () => {
    expect(validateHealthStatus({ status: 'degraded' })).toEqual({ status: 'degraded' });
  });

  it('accepts status "down"', () => {
    expect(validateHealthStatus({ status: 'down' })).toEqual({ status: 'down' });
  });
});

describe('SystemClient with validateResponses=true (issue #422)', () => {
  it('validates health response when validateResponses is enabled', async () => {
    const config = resolveLilySdkConfig({ baseUrl: 'https://test.example.com', validateResponses: true });
    const client = new SystemClient(config);
    
    // Mock the parent request method
    const mockRequest = vi.fn().mockResolvedValue({ status: 'ok', version: '2.0', uptime: 100 });
    client.request = mockRequest as any;
    
    const result = await client.health();
    expect(result.status).toBe('ok');
    expect(result.version).toBe('2.0');
  });

  it('rejects invalid health response when validateResponses is enabled', async () => {
    const config = resolveLilySdkConfig({ baseUrl: 'https://test.example.com', validateResponses: true });
    const client = new SystemClient(config);
    
    const mockRequest = vi.fn().mockResolvedValue({ status: 'invalid_status' });
    client.request = mockRequest as any;
    
    await expect(client.health()).rejects.toThrow('VALIDATION_ERROR');
  });
});
