import { describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

describe('tree-shaking verification for sideEffects: false', () => {
  it('drops validation module when importing only error classes', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'lily-treeshake-'));
    const entryFile = resolve(tmpDir, 'entry.js');
    const outFile = resolve(tmpDir, 'bundle.js');

    // Import ONLY error classes — no SDK, no clients, no validation
    await writeFile(
      entryFile,
      `
      import { LilyApiError, LilyTransportError } from '${resolve(__dirname, '..', 'src', 'index.ts')}';
      export const err = new LilyApiError('test', { statusCode: 500 });
      export const terr = new LilyTransportError('net', { code: 'NET' });
    `,
    );

    await build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'node',
      treeShaking: true,
      minify: false,
      external: ['node:*'],
    });

    const bundleContent = await readFile(outFile, 'utf-8');

    // Should contain the error classes
    expect(bundleContent).toContain('LilyApiError');
    expect(bundleContent).toContain('LilyTransportError');

    // Should NOT contain validation logic (validateMoneyAmount, validateMemo, etc.)
    // These are in src/validation.ts and should be tree-shaken when not imported
    expect(bundleContent).not.toContain('validateMoneyAmount');
    expect(bundleContent).not.toContain('validateMemo');
    expect(bundleContent).not.toContain('STELLAR_ASSET_CODE_PATTERN');

    // Should NOT contain client implementations
    expect(bundleContent).not.toContain('createFetchHttpClient');
    expect(bundleContent).not.toContain('buildHeaders');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('drops HTTP transport when importing only config resolver', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'lily-treeshake-'));
    const entryFile = resolve(tmpDir, 'entry.js');
    const outFile = resolve(tmpDir, 'bundle.js');

    // Import ONLY the config resolver — no HTTP, no clients
    await writeFile(
      entryFile,
      `
      import { resolveLilySdkConfig } from '${resolve(__dirname, '..', 'src', 'index.ts')}';
      export const config = resolveLilySdkConfig({ baseUrl: 'https://api.test' });
    `,
    );

    await build({
      entryPoints: [entryFile],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'node',
      treeShaking: true,
      minify: false,
      external: ['node:*'],
    });

    const bundleContent = await readFile(outFile, 'utf-8');

    // Should contain config resolution
    expect(bundleContent).toContain('resolveLilySdkConfig');

    // Should NOT contain HTTP transport internals
    expect(bundleContent).not.toContain('createFetchHttpClient');
    expect(bundleContent).not.toContain('serializeBody');
    expect(bundleContent).not.toContain('parseResponse');

    // Should NOT contain client classes
    expect(bundleContent).not.toContain('AgentClient');
    expect(bundleContent).not.toContain('PaymentClient');

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('ESM and CJS dist bundles expose identical public symbols', async () => {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const distEsm = resolve(__dirname, '..', 'dist', 'index.js');
    const distCjs = resolve(__dirname, '..', 'dist', 'index.cjs');

    const esm = await import(distEsm);
    const cjs = require(distCjs);

    const esmKeys = Object.keys(esm)
      .filter((k) => k !== 'default')
      .sort();
    const cjsKeys = Object.keys(cjs)
      .filter((k) => k !== 'default')
      .sort();

    expect(esmKeys).toEqual(cjsKeys);
    expect(esmKeys.length).toBeGreaterThan(0);
  });
});
