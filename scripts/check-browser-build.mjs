import { existsSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const exportEntries = Object.entries(packageJson.exports).filter(
  ([name]) => name !== './package.json',
);
const nodeBuiltinPattern = new RegExp(
  `(?:from\\s*|import\\s*\\()(['\"])(?:node:)?(?:${builtinModules
    .filter((name) => !name.startsWith('_'))
    .map((name) => name.replace('/', '\\/'))
    .join('|')})(?:\\/[^'\"]*)?\\1`,
);

for (const [name, conditions] of exportEntries) {
  if (
    typeof conditions !== 'object' ||
    typeof conditions.browser !== 'string'
  ) {
    throw new Error(`${name} is missing a browser export condition`);
  }

  const browserUrl = new URL(
    `..${conditions.browser.slice(1)}`,
    import.meta.url,
  );
  if (!existsSync(browserUrl)) {
    throw new Error(
      `${name} browser build does not exist at ${conditions.browser}`,
    );
  }

  const source = readFileSync(browserUrl, 'utf8');
  if (nodeBuiltinPattern.test(source)) {
    throw new Error(`${name} browser build imports a Node.js built-in module`);
  }

  await import(browserUrl);
}

console.log(`Verified ${exportEntries.length} browser exports.`);
