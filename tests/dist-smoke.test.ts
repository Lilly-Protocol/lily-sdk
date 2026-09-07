import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const distEsm = resolve(__dirname, '..', 'dist', 'index.js');
const distCjs = resolve(__dirname, '..', 'dist', 'index.cjs');

describe('dist smoke test', () => {
  it('ESM import exposes LilySdk, a client, and an error class', async () => {
    const mod = await import(distEsm);
    expect(mod.LilySdk).toBeTypeOf('function');
    expect(mod.AgentClient).toBeTypeOf('function');
    expect(mod.LilySdkError).toBeTypeOf('function');
    expect(mod.LilyApiError).toBeTypeOf('function');
  });

  it('CJS require exposes LilySdk, a client, and an error class', () => {
    const mod = require(distCjs);
    expect(mod.LilySdk).toBeTypeOf('function');
    expect(mod.AgentClient).toBeTypeOf('function');
    expect(mod.LilySdkError).toBeTypeOf('function');
    expect(mod.LilyApiError).toBeTypeOf('function');
  });

  it('ESM and CJS expose the same public symbol names', async () => {
    const esm = await import(distEsm);
    const cjs = require(distCjs);
    const esmKeys = Object.keys(esm)
      .filter((k) => k !== 'default')
      .sort();
    const cjsKeys = Object.keys(cjs)
      .filter((k) => k !== 'default')
      .sort();
    expect(esmKeys).toEqual(cjsKeys);
  });
});
