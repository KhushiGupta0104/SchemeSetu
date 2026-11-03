import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests. Starts an isolated API (in-memory MongoDB, port 5100) and the Vite dev
 * server (port 5174) proxying /api to it. Run with: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
  ],
  webServer: [
    {
      command: 'npx tsx server/src/tests/e2eServer.ts',
      url: 'http://localhost:5100/health',
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: 'pipe',
    },
    {
      command: 'npm run dev -w client -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      timeout: 120_000,
      reuseExistingServer: false,
      env: { VITE_DEV_API_TARGET: 'http://localhost:5100' },
    },
  ],
});
