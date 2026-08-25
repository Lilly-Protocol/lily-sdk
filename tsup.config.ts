import { defineConfig } from 'tsup';

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
  minify: true,
  target: 'node20',
  outDir: 'dist',
});
