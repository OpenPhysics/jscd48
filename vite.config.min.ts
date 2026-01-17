import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CD48',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return 'cd48.esm.min.js';
        }
        if (format === 'umd') {
          return 'cd48.umd.min.js';
        }
        return `cd48.${format}.min.js`;
      },
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
    },
    outDir: 'dist',
    emptyOutDir: false, // Don't empty since we're building multiple times
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
  },
});
