// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,          // fail the build if someone leaves test.only in
  retries: process.env.CI ? 2 : 0,       // retry flaky tests on the CI machine only
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    // CHROMIUM_PATH lets you point at an already-installed browser. Leave it unset normally.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // SITE_DIR=_site tests the built site (what will really be published). Default tests the source files.
    command: `npx http-server ${process.env.SITE_DIR || '.'} -p 4173 -c-1 -s`,
    url: 'http://localhost:4173/index.html',
    reuseExistingServer: !process.env.CI
  }
});
