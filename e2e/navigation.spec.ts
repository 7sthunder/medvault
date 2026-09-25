import { expect, test } from "@playwright/test";

const PASSWORD = "vaultPass9";

test.describe("Phase 09 — Global Shell & Navigation", () => {
  test("logged-in desktop navigation across shell routes and breadcrumbs", async ({ page }) => {
    const email = `nav-${Date.now()}@example.com`;

    // Sign up a user
    await page.goto("/register");
    await page.getByLabel(/Full Name/i).fill("Aadhi Nav");
    await page.getByLabel(/Email Address/i).fill(email);
    await page.getByPlaceholder("At least 8 chars, letter + number").fill(PASSWORD);
    await page.getByRole("button", { name: /Create Vault/i }).click();

    // Pass onboarding to dashboard
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
    await page.getByRole("button", { name: /Continue to dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

    // Check AppShell presence
    const sidebar = page.getByLabel("Sidebar navigation");
    await expect(sidebar).toBeVisible();
    await expect(page.getByLabel("Notifications")).toBeVisible();
    await expect(page.getByLabel(/User menu for Aadhi Nav/i)).toBeVisible();

    // Navigate to Medications via sidebar link
    await sidebar.getByRole("link", { name: "Medications" }).click();
    await expect(page).toHaveURL(/\/medications/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Medications");

    // Navigate to Today's Schedule via sidebar link
    await sidebar.getByRole("link", { name: "Today's Schedule" }).click();
    await expect(page).toHaveURL(/\/schedule/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today's Schedule");

    // Navigate to Adherence
    await sidebar.getByRole("link", { name: "Adherence" }).click();
    await expect(page).toHaveURL(/\/adherence/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Adherence Analytics");

    // Verify breadcrumbs
    const breadcrumbs = page.getByLabel("Breadcrumbs");
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText("Adherence");
  });

  test("mobile viewport shows bottom nav and More sheet drawer", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const email = `mobile-${Date.now()}@example.com`;

    // Sign up a user
    await page.goto("/register");
    await page.getByLabel(/Full Name/i).fill("Mobile User");
    await page.getByLabel(/Email Address/i).fill(email);
    await page.getByPlaceholder("At least 8 chars, letter + number").fill(PASSWORD);
    await page.getByRole("button", { name: /Create Vault/i }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });
    await page.getByRole("button", { name: /Continue to dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

    // Bottom nav should be visible on mobile
    const bottomNav = page.getByLabel("Mobile navigation");
    await expect(bottomNav).toBeVisible();

    // 5 items present
    await expect(bottomNav.getByRole("link", { name: "Schedule" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Medications" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Adherence" })).toBeVisible();
    await expect(bottomNav.getByRole("button", { name: "More navigation options" })).toBeVisible();

    // Open More sheet
    await bottomNav.getByRole("button", { name: "More navigation options" }).click();
    await expect(page.getByText("More Options")).toBeVisible();
    await expect(page.getByText("Caregiver")).toBeVisible();

    // Click Caregiver inside More sheet
    await page.getByRole("link", { name: /Caregiver/i }).click();
    await expect(page).toHaveURL(/\/caregiver/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Caregiver Management");
  });
});
