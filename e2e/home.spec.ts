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

  // Hydration must complete before clicking: a pre-hydration click on a next/link is swallowed
  // and the URL never changes, which is what made this test fail intermittently.
  await page.waitForLoadState("networkidle");

  const navCta = page.getByRole("link", { name: "Create Vault", exact: true });
  await expect(navCta).toHaveAttribute("href", "/register");

  const heroCta = page.getByRole("link", { name: /Create Your Health Vault/i });
  await expect(heroCta).toHaveAttribute("href", "/register");

  await heroCta.click();
  await expect(page).toHaveURL(/\/register\/?$/);
});
