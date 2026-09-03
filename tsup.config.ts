import { defineConfig, type Options } from 'tsup';
import pkg from './package.json' assert { type: 'json' };

const commonEntry = [
  'src/index.ts',
  'src/config.ts',
  'src/errors.ts',
  'src/http.ts',
  'src/models.ts',
  'src/testing.ts',
  'src/types.ts',
] as string[];

export const nodeConfig: Options = {
  entry: commonEntry,
  format: ['esm', 'cjs'],
  define: {
    __LILY_SDK_VERSION__: JSON.stringify(pkg.version),
  },
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
};

export const browserConfig: Options = {
  entry: commonEntry,
  format: ['esm'],
  dts: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'es2022',
  platform: 'browser',
  outDir: 'dist/browser',
  external: [],
  noExternal: [],
};

export default defineConfig([nodeConfig, browserConfig]);
