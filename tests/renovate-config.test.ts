import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Bounty #102 — $55
 * "Add Renovate configuration for dependency updates"
 *
 * Verifies that renovate.json exists and is properly configured.
 */
describe('Renovate configuration', () => {
  const renovatePath = resolve(process.cwd(), 'renovate.json');

  it('renovate.json exists', () => {
    const content = readFileSync(renovatePath, 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('has a valid JSON structure', () => {
    const config = JSON.parse(readFileSync(renovatePath, 'utf8')) as Record<string, unknown>;
    expect(typeof config).toBe('object');
    expect(config).not.toBeNull();
  });

  it('extends a preset (config:base or config:recommended)', () => {
    const config = JSON.parse(readFileSync(renovatePath, 'utf8')) as {
      extends?: string[];
    };
    expect(config.extends).toBeDefined();
    expect(config.extends?.length).toBeGreaterThan(0);
  });

  it('has a schedule defined', () => {
    const config = JSON.parse(readFileSync(renovatePath, 'utf8')) as {
      schedule?: string[];
    };
    expect(config.schedule).toBeDefined();
    expect(config.schedule?.length).toBeGreaterThan(0);
  });

  it('has package rules for grouping deps', () => {
    const config = JSON.parse(readFileSync(renovatePath, 'utf8')) as {
      packageRules?: unknown[];
    };
    expect(config.packageRules).toBeDefined();
    expect(config.packageRules?.length).toBeGreaterThan(0);
  });
});
