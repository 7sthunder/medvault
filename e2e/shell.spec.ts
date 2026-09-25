import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "vaultPass9";

async function registerAndEnter(page: Page): Promise<string> {
  const email = `shell-e2e-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel(/Full Name/i).fill("Shell Tester");
  await page.getByLabel(/Email Address/i).fill(email);
  await page.getByPlaceholder("At least 8 chars, letter + number").fill(PASSWORD);
  await page.getByRole("button", { name: /Create Vault/i }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
  await page.getByRole("button", { name: /Next/i }).click();
  await page.getByRole("button", { name: /Next/i }).click();
  await page.getByRole("button", { name: /Continue to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  return email;
}

test("desktop shell: sidebar nav, shell persistence and profile menu", async ({ page }) => {
  const email = await registerAndEnter(page);

  const sidebar = page.getByRole("navigation", { name: "Main navigation" });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  await expect(sidebar.getByRole("link", { name: "Medications" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Today's Schedule" })).toBeVisible();

  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

  await page.goto("/dashboard");
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

  await sidebar.getByRole("link", { name: "Today's Schedule" }).click();
  await expect(page).toHaveURL(/\/schedule/);
  await expect(page.getByRole("heading", { name: "404", level: 1 })).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open profile menu" }).click();
  const profileMenu = page.getByRole("menu", { name: "Open profile menu" });
  await expect(profileMenu.getByText(email)).toBeVisible();
  await expect(profileMenu.getByRole("menuitem", { name: /Settings/i })).toBeVisible();

  await page.getByRole("menuitem", { name: /Sign out/i }).click();
  await expect(page).toHaveURL("/");
});

test("mobile shell: bottom nav and More sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndEnter(page);

  const bottomNav = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

  await bottomNav.getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL(/\/schedule/);
  await expect(page.getByRole("heading", { name: "404", level: 1 })).toBeVisible();

  await page.goto("/dashboard");
  await bottomNav.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("heading", { name: "Menu" })).toBeVisible();
  await expect(page.getByText("Everything in your vault.")).toBeVisible();

  await page.getByRole("link", { name: "Notifications" }).click();
  await expect(page).toHaveURL(/\/notifications/);
});