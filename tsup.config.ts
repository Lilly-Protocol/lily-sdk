import { defineConfig } from 'tsup';
import pkg from './package.json' assert { type: 'json' };

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
});
