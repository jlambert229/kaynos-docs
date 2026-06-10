const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const isLocal = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  ...(isLocal
    ? {
        webServer: {
          command: 'npx http-server . -p 3000 -c-1',
          url: 'http://localhost:3000',
          // CI starts its own http-server and waits on it before running
          // Playwright (see .github/workflows), so always attach to an
          // already-running server instead of failing on the busy port.
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }
    : {}),
  projects: [
    {
      name: 'iPhone 14 (Chromium)',
      use: {
        ...devices['iPhone 14'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'iPhone 14 Pro Max (Chromium)',
      use: {
        ...devices['iPhone 14 Pro Max'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'iPad Mini (Chromium)',
      use: {
        ...devices['iPad Mini'],
        defaultBrowserType: 'chromium',
      },
    },
  ],
});
