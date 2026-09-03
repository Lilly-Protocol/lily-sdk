import { describe, it, expect } from 'vitest';
import { ResponseValidator, type ValidationRule } from '../src/validators/response-validator';

describe('Response payload validator (issue #75)', () => {
  const rules: Record<string, ValidationRule[]> = {
    'GET /v1/payments': [
      { field: 'id', type: 'string', required: true },
      { field: 'amount', type: 'string', required: true },
      { field: 'currency', type: 'string', required: true },
      { field: 'status', type: 'string', required: true, validate: (v) => ['pending', 'completed', 'failed'].includes(v as string) },
    ],
  };

  const validator = new ResponseValidator(rules);

  it('validates a correct payload', () => {
    const result = validator.validate('GET /v1/payments', { id: 'pay_123', amount: '100.00', currency: 'USD', status: 'completed' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports missing required fields', () => {
    const result = validator.validate('GET /v1/payments', { id: 'pay_123' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: amount');
    expect(result.errors).toContain('Missing required field: currency');
    expect(result.errors).toContain('Missing required field: status');
  });

  it('reports type mismatches', () => {
    const result = validator.validate('GET /v1/payments', { id: 123, amount: '100', currency: 'USD', status: 'completed' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('id expected string'))).toBe(true);
  });

  it('runs custom validators', () => {
    const result = validator.validate('GET /v1/payments', { id: 'x', amount: '1', currency: 'USD', status: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('failed custom validation'))).toBe(true);
  });

  it('passes unknown endpoints without rules', () => {
    const result = validator.validate('GET /v1/unknown', { anything: true });
    expect(result.valid).toBe(true);
  });

  it('handles null/undefined data gracefully', () => {
    const result = validator.validate('GET /v1/payments', null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
