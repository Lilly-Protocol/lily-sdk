import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '..', 'package.json');
const outPath = resolve(__dirname, '..', 'src', 'version.ts');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = typeof pkg.version === 'string' ? pkg.version : '0.0.0';

writeFileSync(outPath, `export const SDK_VERSION = '${version}';\n`, 'utf8');
console.log(`Generated src/version.ts with version ${version}`);
