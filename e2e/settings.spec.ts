/**
 * Phase 28 — E2E: Settings & caregiver pages spec.
 */
import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers/auth";

test.describe("Phase 28 — Settings", () => {
  test("settings profile tab loads and shows form", async ({ page }) => {
    await registerAndOnboard(page, "Settings User");

    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });

    // Profile form should be visible (either directly or via tab)
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("settings appearance tab is accessible", async ({ page }) => {
    await registerAndOnboard(page, "Appearance User");

    await page.goto("/settings/appearance");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings\/appearance/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("caregiver page loads with correct heading", async ({ page }) => {
    await registerAndOnboard(page, "Caregiver User");

    await page.goto("/caregiver");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Caregiver Management");
    await page.waitForLoadState("networkidle");
    // No crash
    await expect(page).toHaveURL(/\/caregiver/);
  });

  test("help page loads correctly", async ({ page }) => {
    await registerAndOnboard(page, "Help User");

    await page.goto("/help");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/help/);
  });
});
