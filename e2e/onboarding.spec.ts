import { expect, test } from "@playwright/test";

const PASSWORD = "vaultPass9";

test.describe("Phase 10 — Onboarding Flow", () => {
  test("new registered user completes multi-step onboarding wizard into dashboard", async ({ page }) => {
    const email = `onboard-${Date.now()}@example.com`;

    // 1. Sign up
    await page.goto("/register");
    await page.getByLabel(/Full Name/i).fill("Aadhi Patient");
    await page.getByLabel(/Email Address/i).fill(email);
    await page.getByPlaceholder("At least 8 chars, letter + number").fill(PASSWORD);
    await page.getByRole("button", { name: /Create Vault/i }).click();

    // 2. Lands on standalone Onboarding Wizard
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Confirm Timezone & Profile");

    // Step 1: Profile & Timezone
    await expect(page.getByLabel(/Your Name/i)).toBeVisible();
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 2: Reminder Habits
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Personalize Reminder Habits");
    await page.getByText("Balanced").click();
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 3: Sample Medication & Launch
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Ready to Launch Your Vault");
    await expect(page.getByText("Metformin 500mg")).toBeVisible();
    await page.getByRole("button", { name: /Launch Dashboard/i }).click();

    // 3. Arrives at authenticated Dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Welcome back/i);
  });
});
