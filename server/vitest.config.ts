import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/tests/globalSetup.ts'],
    setupFiles: ['src/tests/setupEnv.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    pool: 'forks',
  },
});
