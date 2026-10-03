import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// `npm run test:e2e` builds the app, then serves it on its own port against a freshly seeded
// database in .data/e2e, so the browser tests never touch your dev data.
export default defineConfig({
  testDir: "e2e",
  // One shared database, and flows that build on the seed: run in order.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-GB",
    trace: "retain-on-failure",
    // Locally use the installed Chrome (no browser download); CI installs Playwright's Chromium.
    ...devices["Desktop Chrome"],
    ...(process.env.CI ? {} : { channel: "chrome" }),
  },
  projects: [
    { name: "desktop", grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], ...(process.env.CI ? {} : { channel: "chrome" }) }, grep: /@mobile/ },
  ],
  webServer: {
    command: "npm run e2e:server",
    url: `http://localhost:${PORT}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PGLITE_DIR: ".data/e2e",
      STORAGE_DIR: ".data/e2e-uploads",
      MAIL_FILE: ".data/e2e-mail.jsonl",
      APP_URL: `http://localhost:${PORT}`,
      DATABASE_URL: "",
    },
  },
});
