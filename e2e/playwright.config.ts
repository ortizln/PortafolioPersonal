import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200/portfolio',
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: process.platform === 'win32' ? 'set RATE_LIMIT_AUTH_MAX=100000&& set RATE_LIMIT_MAX=100000&& npm start' : 'RATE_LIMIT_AUTH_MAX=100000 RATE_LIMIT_MAX=100000 npm start',
      cwd: '../backend',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 120_000
    },
    {
      command: 'node serve-dist.js',
      cwd: '.',
      url: 'http://localhost:4200/portfolio',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
});
