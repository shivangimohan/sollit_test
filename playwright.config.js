// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 120 * 1000, // Increase timeout to 2 minutes for CAPTCHA solving
  expect: {
    timeout: 15000
  },
  
  // IMPORTANT: Set to false to run tests sequentially, not in parallel
  fullyParallel: false,
  
  // IMPORTANT: Set to 1 to ensure only one test runs at a time
  workers: 1,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Reporter to use
  reporter: [['html'], ['line']],
  
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'https://login.funda.nl',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'on-first-retry',

    // Configure browser storage state path for login persistence
    storageState: './data/state.json',
    
    // IMPORTANT: Default to non-headless mode for CAPTCHA testing
    headless: false,
    
    // Slow down operations by ms to better see what's happening during CAPTCHA solving
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 50, // Default to 50ms slowdown
    },
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});