/**
 * Phase 28 — e2e helpers: shared auth + registration flow.
 */
import type { Page } from "@playwright/test";

export const PASSWORD = "vaultPass9";

/**
 * Register a fresh user and complete onboarding, landing on /dashboard.
 * Returns the email used.
 */
export async function registerAndOnboard(page: Page, name = "E2E User"): Promise<string> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

  await page.goto("/register");
  await page.getByLabel(/Full Name/i).fill(name);
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("At least 8 chars, letter + number").fill(PASSWORD);
  await page.getByRole("button", { name: /Create Vault/i }).click();

  await page.waitForURL(/\/onboarding/, { timeout: 60_000 });
  await page.getByRole("button", { name: /Continue to dashboard/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });

  return email;
}

/**
 * Log in an existing user, land on /dashboard.
 */
export async function login(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /Access Vault/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
}
