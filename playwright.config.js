const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
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
