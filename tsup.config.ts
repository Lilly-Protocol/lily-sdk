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
  target: 'node20',
  outDir: 'dist',
});

// Browser-target build configuration
export const browserConfig = defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: false,
  splitting: false,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist/browser',
  platform: 'browser',
  env: {
    NODE_ENV: 'production',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
