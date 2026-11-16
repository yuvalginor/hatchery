import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// BASE_URL set: test a deployed site through the session proxy, which adds the Access service token when Access is on.
// Unset: test dist/ under wrangler dev, which serves it like production, _headers included.
const remote = Boolean(process.env.BASE_URL);
// E2E_PORT lets two checkouts run their tests at once without sharing a server.
const port = process.env.E2E_PORT ?? '4173';
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;
// Cloud sessions ship one Chromium build. Use it whatever @playwright/test version is installed.
const cloudChromium = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL,
    launchOptions: existsSync(cloudChromium) ? { executablePath: cloudChromium } : {},
    proxy: remote && process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: remote
    ? undefined
    : {
        command: `npx wrangler dev --port ${port} --ip 127.0.0.1`,
        url: baseURL,
        env: { WRANGLER_SEND_METRICS: 'false' },
        reuseExistingServer: !process.env.CI,
      },
});
