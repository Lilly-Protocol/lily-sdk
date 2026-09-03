import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');

describe('Contract Drift Check', () => {
  it('CI workflow file exists and contains drift detection logic', () => {
    const workflowPath = resolve(ROOT, '.github', 'workflows', 'contract-drift.yml');
    const content = readFileSync(workflowPath, 'utf-8');

    expect(content).toContain('npm run codegen');
    expect(content).toContain('git diff --exit-code src/generated/types.ts');
    expect(content).toContain('CONTRACT DRIFT DETECTED');
  });

  it('PR template mentions contract regeneration', () => {
    const templatePath = resolve(ROOT, '.github', 'PULL_REQUEST_TEMPLATE.md');
    const content = readFileSync(templatePath, 'utf-8');

    expect(content).toContain('npm run codegen');
    expect(content).toContain('src/generated/types.ts');
    expect(content).toContain('CODEGEN.md');
  });

  it('regenerating contracts produces no diff (no drift)', () => {
    // Run codegen and check that output matches committed file
    const before = readFileSync(resolve(ROOT, 'src', 'generated', 'types.ts'), 'utf-8');

    execSync('npx tsx scripts/codegen.ts', { cwd: ROOT, stdio: 'pipe' });

    const after = readFileSync(resolve(ROOT, 'src', 'generated', 'types.ts'), 'utf-8');
    expect(after).toBe(before);
  });
});
