import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/config.ts',
    'src/errors.ts',
    'src/http.ts',
    'src/models.ts',
    'src/types.ts',
  ],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      exactOptionalPropertyTypes: true,
    },
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node20',
  outDir: 'dist',
  define: {
    __LILY_SDK_VERSION__: JSON.stringify(packageJson.version),
  },
});
