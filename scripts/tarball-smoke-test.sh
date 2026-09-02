#!/usr/bin/env bash
set -euo pipefail

TARBALL=$(npm pack --pack-destination /tmp 2>/dev/null | tail -1)
if [ -z "$TARBALL" ] || [ ! -f "/tmp/$TARBALL" ]; then
  echo "ERROR: npm pack failed to produce a tarball"
  exit 1
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

cd "$WORKDIR"
npm init -y >/dev/null 2>&1
npm install "/tmp/$TARBALL" >/dev/null 2>&1

# ESM smoke test
cat > test-esm.mjs << 'ESMEOF'
import { LilySdk } from '@lily-protocol/sdk';
import { resolveLilySdkConfig } from '@lily-protocol/sdk/config';
import { LilySdkError, LilyApiError } from '@lily-protocol/sdk/errors';

console.log('ESM: all subpaths resolved successfully');
ESMEOF

node test-esm.mjs

# CJS smoke test
cat > test-cjs.cjs << 'CJSEOF'
const { LilySdk } = require('@lily-protocol/sdk');
const { resolveLilySdkConfig } = require('@lily-protocol/sdk/config');
const { LilySdkError, LilyApiError } = require('@lily-protocol/sdk/errors');

console.log('CJS: all subpaths resolved successfully');
CJSEOF

node test-cjs.cjs

echo "OK: All exports subpaths resolve in both ESM and CJS"
