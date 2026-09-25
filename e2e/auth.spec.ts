import { expect, test } from "@playwright/test";

const PASSWORD = "vaultPass9";

test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Welcome\s*back\.?/i);
});

test("register -> onboarding -> dashboard -> logout -> login round trip", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel(/Full Name/i).fill("E2E Vault");
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("At least 8 chars, letter + number").fill(PASSWORD);
  await page.getByRole("button", { name: /Create Vault/i }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
  await page.getByRole("button", { name: /Continue to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

  await page.getByLabel(/User menu/i).click();
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole("menuitem", { name: /Sign out/i }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/login");
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: /Access Vault/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  await page.getByLabel(/User menu/i).click();
  await expect(page.getByText(email)).toBeVisible();
});