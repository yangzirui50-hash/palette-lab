import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:7101',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `"${process.execPath}" scripts/prepare-test-env.mjs && "${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 7101`,
    url: 'http://127.0.0.1:7101',
    reuseExistingServer: false,
    env: { AI_PROVIDER: 'mock' },
    timeout: 120_000,
  },
})
