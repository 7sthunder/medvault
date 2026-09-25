import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // A single `next dev` server backs every test; cap workers to avoid
  // cold-compile contention (auth round trips were timing out under load).
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // Cold `next dev` compiles of fresh routes can exceed 30s on this machine.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Dev server by default, as before. Set E2E_TARGET=prod to run against the production build,
    // which is faster and matches what users get, but note that dev-only pages such as
    // /design-system redirect to / outside development.
    command: process.env.E2E_TARGET === "prod" ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
