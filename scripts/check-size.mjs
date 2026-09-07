import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const budgets = {
  'dist/index.js': 8 * 1024,
  'dist/index.cjs': 8 * 1024,
};

let failed = false;

for (const [file, budget] of Object.entries(budgets)) {
  const contents = await readFile(file);
  const gzipBytes = gzipSync(contents, { level: 9 }).byteLength;
  const status = gzipBytes <= budget ? 'PASS' : 'FAIL';

  console.log(
    `${status} ${file}: ${formatBytes(gzipBytes)} gzip (budget ${formatBytes(budget)})`,
  );
  failed ||= gzipBytes > budget;
}

// Bundle a consumer that imports one small helper from the package root. This
// catches regressions where the sideEffects contract or a barrel export causes
// the rest of the SDK to be retained by consumers.
const treeShaken = await build({
  stdin: {
    contents: `
      import { resolveLilySdkConfig } from './dist/index.js';
      console.log(resolveLilySdkConfig({ apiKey: 'test-key' }));
    `,
    resolveDir: process.cwd(),
    sourcefile: 'tree-shaking-check.mjs',
  },
  bundle: true,
  format: 'esm',
  minify: true,
  platform: 'node',
  target: 'node20',
  treeShaking: true,
  write: false,
});

const treeShakenBudget = 2 * 1024;
const treeShakenGzipBytes = gzipSync(treeShaken.outputFiles[0].contents, {
  level: 9,
}).byteLength;
const treeShakenStatus =
  treeShakenGzipBytes <= treeShakenBudget ? 'PASS' : 'FAIL';

console.log(
  `${treeShakenStatus} tree-shaken ESM consumer: ${formatBytes(treeShakenGzipBytes)} gzip ` +
    `(budget ${formatBytes(treeShakenBudget)})`,
);
failed ||= treeShakenGzipBytes > treeShakenBudget;

if (failed) {
  console.error('Bundle size budget exceeded.');
  process.exitCode = 1;
}

function formatBytes(bytes) {
  return `${bytes} B`;
}
