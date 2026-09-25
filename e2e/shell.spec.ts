/**
 * Phase 28 — E2E: Shell & accessibility spec.
 * Covers: skip link visible on focus, keyboard navigation, error pages.
 */
import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers/auth";

test.describe("Phase 28 — Shell & Accessibility", () => {
  test("skip link appears on first Tab and points to #main-content", async ({ page }) => {
    await registerAndOnboard(page, "Shell A11y");

    // Press Tab once — skip link should appear
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: /Skip to main content/i });
    await expect(skipLink).toBeVisible({ timeout: 5_000 });

    // Clicking it should move focus to #main-content
    await skipLink.click();
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible();
  });

  test("404 not-found page renders correctly", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz-abc");
    // Should render a not-found page (200 with custom not-found UI or 404)
    await expect(page.getByText(/not found|doesn't exist|404/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("all primary nav links are reachable from dashboard", async ({ page }) => {
    await registerAndOnboard(page, "Nav Test");

    const navLinks = [
      { name: /Dashboard/i, url: /\/dashboard/ },
      { name: /Medications/i, url: /\/medications/ },
      { name: /Schedule/i, url: /\/schedule/ },
      { name: /Adherence/i, url: /\/adherence/ },
    ];

    for (const link of navLinks) {
      // Use sidebar on desktop
      const sidebar = page.getByLabel("Sidebar navigation");
      await sidebar.getByRole("link", { name: link.name }).click();
      await expect(page).toHaveURL(link.url, { timeout: 15_000 });
    }
  });

  test("profile menu opens and contains user email", async ({ page }) => {
    const email = await registerAndOnboard(page, "Profile Menu");

    const profileBtn = page.getByLabel(/User menu/i);
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Email should appear in the menu
    await expect(page.getByText(email)).toBeVisible({ timeout: 5_000 });
  });
});
