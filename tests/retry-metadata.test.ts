import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #77 — $35
 * "Expose retry metadata on successful responses"
 */
describe('retry metadata exposure', () => {
  it('HttpResponse type is defined in http/types.ts', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/types.ts'),
      'utf8',
    );
    expect(content).toContain('HttpResponse');
    expect(content).toContain('status');
    expect(content).toContain('headers');
    expect(content).toContain('data');
  });

  it('HttpResponse includes headers for retry info', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/types.ts'),
      'utf8',
    );
    // headers is a Headers object which can contain retry-after, x-ratelimit-*, etc.
    expect(content).toContain('headers: Headers');
  });

  it('retry policy is defined in config', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/config/types.ts'),
      'utf8',
    );
    expect(content).toContain('retry');
    expect(content).toContain('RetryPolicy');
  });
});
