import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Wallet ESM/CJS smoke example (issue #4)', () => {
  it('example file exists', () => {
    const content = readFileSync(join(process.cwd(), 'examples/wallet-esm-cjs.ts'), 'utf-8');
    expect(content).toContain('LilySdk');
    expect(content).toContain('wallets.list');
  });

  it('uses ESM import syntax', () => {
    const content = readFileSync(join(process.cwd(), 'examples/wallet-esm-cjs.ts'), 'utf-8');
    expect(content).toMatch(/import\s+.*from/);
  });

  it('documents CJS usage in comments', () => {
    const content = readFileSync(join(process.cwd(), 'examples/wallet-esm-cjs.ts'), 'utf-8');
    expect(content).toContain('require(');
  });
});
