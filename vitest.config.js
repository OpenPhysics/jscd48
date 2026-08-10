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
      // Minimum coverage thresholds. Set to just under the current measured
      // coverage of cd48.js (the gap is mostly auto-reconnect / advanced-measure
      // branches). Raise these as the corresponding unit tests are added.
      thresholds: {
        lines: 82,
        functions: 88,
        branches: 76,
        statements: 82,
      },
    },
  },
});
