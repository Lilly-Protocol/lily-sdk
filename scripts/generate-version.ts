import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = resolve(__dirname, '..', 'package.json');
const outPath = resolve(__dirname, '..', 'src', 'version.ts');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = typeof pkg.version === 'string' ? pkg.version : '0.0.0';

writeFileSync(outPath, `export const SDK_VERSION = '${version}';\n`, 'utf8');
console.log(`Wrote SDK_VERSION=${version} to src/version.ts`);
