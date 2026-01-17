import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Exclude E2E tests (run with Playwright) and benchmarks (run separately)
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.bench.js'],
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'examples/', '*.config.js', 'docs/'],
      // Enforce minimum coverage thresholds
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
