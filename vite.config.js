import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: '/examples/',
    cors: true,
    fs: {
      strict: false,
    },
    hmr: {
      overlay: true,
    },
  },
  preview: {
    port: 4173,
    open: '/examples/',
  },
  publicDir: false,
  build: {
    outDir: 'dist-site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        examples: 'examples/index.html',
      },
    },
  },
});
