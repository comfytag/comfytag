import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'tests/results.json' }]],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'web',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
    },
    {
      name: 'partner',
      testDir: './tests/e2e-partner',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
    },
    {
      name: 'admin',
      testDir: './tests/e2e-admin',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3002' },
    },
  ],
  webServer: [
    {
      command: 'npx next dev --turbopack',
      cwd: 'apps/web',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npx next dev --turbopack -p 3001',
      cwd: 'apps/partner',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npx next dev --turbopack -p 3002',
      cwd: 'apps/admin',
      url: 'http://localhost:3002',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
})
