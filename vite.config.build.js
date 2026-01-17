import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'cd48.js'),
      name: 'CD48',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return 'cd48.esm.js';
        }
        if (format === 'umd') {
          return 'cd48.umd.js';
        }
        return `cd48.${format}.js`;
      },
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        globals: {},
        exports: 'named',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false, // We'll create separate minified versions
  },
});
