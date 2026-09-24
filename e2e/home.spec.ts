import { test, expect } from "@playwright/test";

test("home page renders the MedVault placeholder", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "MedVault", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
});