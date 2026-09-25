import { test, expect } from "@playwright/test";

test("home page renders the marketing landing headline", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1 }).filter({ hasText: /Your entire\s*medical life/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Create Your Health Vault/i })).toBeVisible();
});

test("landing 'Create Vault' routes to /register", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create Vault" }).click();

  await expect(page).toHaveURL(/\/register\/?$/);
});
