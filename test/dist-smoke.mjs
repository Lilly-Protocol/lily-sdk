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
  assert.equal(
    typeof sdk.parseCursorPage,
    'function',
    `${format} exports parseCursorPage`,
  );
  assert.equal(
    typeof sdk.buildPaginationQuery,
    'function',
    `${format} exports buildPaginationQuery`,
  );
  assert.equal(
    typeof sdk.paginate,
    'function',
    `${format} exports paginate`,
  );
  assert.ok(
    sdk.CursorPage !== undefined,
    `${format} exports CursorPage type`,
  );
}
