import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    globals: true,
    hookTimeout: 15000,  // 15s for Docker DB connection
    testTimeout: 15000,  // 15s per test
    coverage: { provider: 'v8', threshold: { lines: 90, functions: 90 } },
  },
});
