import { defineConfig } from 'tsup';

const entry = [
  'src/index.ts',
  'src/config.ts',
  'src/errors.ts',
  'src/http.ts',
  'src/models.ts',
  'src/types.ts',
];

export default defineConfig([
  {
    entry,
    format: ['esm', 'cjs'],
    dts: {
      compilerOptions: {
        exactOptionalPropertyTypes: true,
      },
    },
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    platform: 'node',
    target: 'node20',
    outDir: 'dist',
  },
  {
    entry,
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    platform: 'browser',
    target: 'es2022',
    outDir: 'dist/browser',
  },
]);
