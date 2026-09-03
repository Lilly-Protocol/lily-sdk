import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const esm = await import('../dist/index.js');
const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');

for (const [format, sdk] of [
  ['ESM', esm],
  ['CJS', cjs],
]) {
  assert.equal(typeof sdk.LilySdk, 'function', `${format} exports LilySdk`);
  assert.equal(
    typeof sdk.AgentClient,
    'function',
    `${format} exports AgentClient`,
  );
  assert.equal(
    typeof sdk.LilySdkError,
    'function',
    `${format} exports LilySdkError`,
  );
}
