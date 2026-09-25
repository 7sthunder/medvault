import { expect, type Page } from "@playwright/test";

/**
 * Shared Playwright fixtures.
 *
 * Every authenticated spec needs a signed-in user with a completed onboarding, and re-running
 * `register → onboarding` inline in each file duplicated ~15 lines of brittle selector work. These
 * helpers keep that flow in one place and give each spec a unique account so parallel workers never
 * collide on the unique email constraint.
 */

export const E2E_PASSWORD = "vaultPass9";

let seq = 0;

export function uniqueEmail(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}@example.com`;
}

/** Register a brand-new account and walk it through onboarding to the dashboard. */
export async function registerAndOnboard(page: Page, prefix = "e2e"): Promise<string> {
  const email = uniqueEmail(prefix);

  await page.goto("/register");
  await page.getByLabel(/Full Name/i).fill("E2E Tester");
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("At least 8 chars, letter + number").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /Create MediTrack AI account/i }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
  await completeOnboarding(page);
  return email;
}

/** The onboarding stepper is Next / Next / Continue. */
export async function completeOnboarding(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Next/i }).click();
  await page.getByRole("button", { name: /Next/i }).click();
  await page.getByRole("button", { name: /Continue to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
}

/** Sign an existing account back in. */
export async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /Sign in to MediTrack AI/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
}

/**
 * Add a medication through the real wizard, ending up back on the list.
 *
 * Selectors mirror the actual components: the unit is a Radix `Select` (a combobox, not a native
 * `<select>`), so it has to be opened and the option clicked. The wizard is Basics → Schedule →
 * Review, and only the final step's button is a submit.
 */
export async function addMedication(
  page: Page,
  name: string,
  options: { dosage?: string; unit?: string } = {},
): Promise<void> {
  await page.goto("/medications/new");
  await page.getByLabel("Medication name", { exact: true }).fill(name);
  await page.getByLabel("Dose", { exact: true }).fill(options.dosage ?? "500");

  await page.getByLabel("Unit", { exact: true }).click();
  await page.getByRole("option", { name: options.unit ?? "mg", exact: true }).click();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  const stepper = page.getByRole("navigation", { name: "Wizard steps" });
  await expect(stepper.locator('[aria-current="step"]')).toHaveText(/Schedule/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(stepper.locator('[aria-current="step"]')).toHaveText(/Review/);
  await page.getByRole("button", { name: /Add medication/i }).click();

  await expect(page).toHaveURL(/\/medications/, { timeout: 60_000 });
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 60_000 });
}

/** Enter the demo workspace and wait for the shell to settle on the dashboard. */
export async function enterDemo(page: Page): Promise<void> {
  await page.goto("/demo");
  await page.locator("#enter").click();
  await expect(page).toHaveURL(/\/demo\/workspace\/dashboard/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });
}

/**
 * Assert a page is serving real content rather than the shell's catch-all 404 (a level-1 "404"
 * heading). Several nav hrefs existed before their route did, and a green click-through test
 * silently proved nothing because the old specs *asserted* the 404 instead of failing on it.
 */
export async function expectNotNotFound(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "404", level: 1 })).toHaveCount(0);
}
