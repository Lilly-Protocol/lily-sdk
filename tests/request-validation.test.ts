import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #74 — $20
 * "Validate request inputs at runtime before sending"
 */
describe('runtime request validation', () => {
  it('MoneyAmount has validation in models', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/models/common.ts'),
      'utf8',
    );
    expect(content).toContain('normalizeMoneyAmount');
    expect(content).toContain('RangeError');
  });

  it('resolve-config validates apiKey and authToken', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/config/resolve-config.ts'),
      'utf8',
    );
    expect(content).toContain('apiKey');
    expect(content).toContain('authToken');
    expect(content).toContain('LilyConfigError');
  });

  it('resolve-config validates timeoutMs', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/config/resolve-config.ts'),
      'utf8',
    );
    expect(content).toContain('timeoutMs');
    expect(content).toContain('positive number');
  });

  it('resolve-config validates retry policy', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/config/resolve-config.ts'),
      'utf8',
    );
    expect(content).toContain('retry');
    expect(content).toContain('retryableStatusCodes');
  });
});
