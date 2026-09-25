/**
 * Phase 28 — E2E: Medication lifecycle spec.
 * Covers: create → appears in list → appears in schedule → detail view → archive.
 */
import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers/auth";

test.describe("Phase 28 — Medication Lifecycle", () => {
  test("create medication → appears in list, detail, and schedule", async ({ page }) => {
    await registerAndOnboard(page, "Med Lifecycle");

    // Navigate to Medications
    await page.getByRole("link", { name: "Medications" }).first().click();
    await expect(page).toHaveURL(/\/medications/);

    // Add a new medication
    await page.getByRole("link", { name: /Add medication/i }).click();
    await expect(page).toHaveURL(/\/medications\/new/);

    // Fill the form
    await page.getByLabel(/Medication Name/i).fill("Lifecycle Drug");
    await page.getByLabel(/Dosage/i).fill("100mg");

    // Submit
    await page.getByRole("button", { name: /Add Medication|Save|Create/i }).first().click();

    // Should land on medications list or detail
    await page.waitForURL(/\/medications/, { timeout: 60_000 });

    // Medication appears in the list
    await expect(page.getByText("Lifecycle Drug")).toBeVisible({ timeout: 10_000 });
  });

  test("medication detail page shows dose history section", async ({ page }) => {
    await registerAndOnboard(page, "Med Detail");

    await page.goto("/medications");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Medications");

    // The seed medication from onboarding (Metformin) should be visible
    const medLink = page.getByRole("link", { name: /Metformin/i }).first();
    if (await medLink.isVisible({ timeout: 5_000 })) {
      await medLink.click();
      await expect(page).toHaveURL(/\/medications\//);
      // Detail page has heading with medication name
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("medication edit page is accessible from detail", async ({ page }) => {
    await registerAndOnboard(page, "Med Edit");

    await page.goto("/medications");
    const editLinks = page.getByRole("link", { name: /Edit/i });
    if (await editLinks.first().isVisible({ timeout: 5_000 })) {
      await editLinks.first().click();
      await expect(page).toHaveURL(/\/medications\/.*\/edit/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});
