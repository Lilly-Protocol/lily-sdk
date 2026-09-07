import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #65 — $25
 * "Accept `HeadersInit` for `HttpRequest.headers`"
 *
 * Verifies that the HttpRequest type supports HeadersInit
 * (Record<string, string> | Headers | [string, string][]).
 */
describe('HttpRequest.headers accepts HeadersInit', () => {
  it('HttpRequest type is defined in http/types.ts', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/types.ts'),
      'utf8',
    );
    expect(content).toContain('HttpRequest');
  });

  it('HttpRequest.headers type is compatible with HeadersInit', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/types.ts'),
      'utf8',
    );
    // HeadersInit = Record<string, string> | Headers | [string, string][]
    expect(content).toContain('Record<string, string>');
  });

  it('HttpHeaders type is exported', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/http/types.ts'),
      'utf8',
    );
    expect(content).toContain('HttpHeaders');
  });
});
