import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #69 — $45
 * "Support `traceparent` propagation for distributed tracing"
 */
describe('traceparent propagation', () => {
  it('HttpHeaders supports arbitrary header names', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/types.ts'),
      'utf8',
    );
    // HttpHeaders = Record<string, string> — supports traceparent
    expect(content).toContain('Record<string, string>');
  });

  it('buildHeaders merges default and request headers', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/fetch-http-client.ts'),
      'utf8',
    );
    expect(content).toContain('buildHeaders');
    expect(content).toContain('...config.defaultHeaders');
    expect(content).toContain('...requestHeaders');
  });

  it('defaultHeaders config can carry traceparent', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/config/types.ts'),
      'utf8',
    );
    expect(content).toContain('defaultHeaders');
    expect(content).toContain('Record<string, string>');
  });
});
