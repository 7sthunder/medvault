import { expect, test } from "@playwright/test";

import { enterDemo, expectNotNotFound } from "./helpers";

/**
 * The demo workspace renders the *real* screens through a validated demo subject rather than a
 * session. Before Phase 19 the shell screens called session-only procedures, so entering the demo
 * and navigating anywhere but the dashboard produced a wall of 401s — a broken product on the one
 * page the whole marketing funnel points at. This spec is the regression guard: every screen the
 * demo nav can reach must render.
 */
test("demo: enters the workspace signed-out and renders the dashboard", async ({ page }) => {
  await enterDemo(page);

  // Still signed out — the demo must not have created or adopted a real session.
  await expect(page.getByRole("button", { name: "Open profile menu" })).toBeVisible();
  await expectNotNotFound(page);
});

test("demo: every nav destination renders without an auth error", async ({ page }) => {
  await enterDemo(page);

  const sidebar = page.getByRole("navigation", { name: "Main navigation" });
  await expect(sidebar).toBeVisible();

  for (const label of [
    "Dashboard",
    "Medications",
    "Today's Schedule",
    "History",
    "Adherence",
    "AI Insights",
    "Reports",
    "Caregiver",
    "Help",
  ]) {
    await sidebar.getByRole("link", { name: label }).click();
    await expect(page).not.toHaveURL(/#/);
    await expectNotNotFound(page);
    // A tRPC failure surfaces as this banner; a signed-out 401 is the regression being guarded.
    await expect(page.getByText(/unauthorized|sign in to continue/i)).toHaveCount(0);
  }
});

test("demo: nav hrefs stay under the /demo/workspace base path", async ({ page }) => {
  await enterDemo(page);

  const hrefs = await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? ""),
    );

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect(href, "demo nav link escaped the base path").toContain("/demo/workspace");
  }
});

test("demo: nested screens reachable from the list views load", async ({ page }) => {
  await enterDemo(page);

  await page.goto("/demo/workspace/medications");
  await expectNotNotFound(page);
  await page
    .getByRole("link")
    .filter({ hasText: /Metformin|Lisinopril|Atorvastatin/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/demo\/workspace\/medications\/[^/]+/);
  await expectNotNotFound(page);

  await page.goto("/demo/workspace/notifications");
  await expectNotNotFound(page);
  await page.goto("/demo/workspace/adherence/medications");
  await expectNotNotFound(page);
  await page.goto("/demo/workspace/settings/reminders");
  await expectNotNotFound(page);
  await page.goto("/demo/workspace/settings/data");
  await expectNotNotFound(page);
});

test("demo: reset asks for confirmation and can be cancelled", async ({ page }) => {
  await enterDemo(page);

  await page.getByRole("button", { name: /reset demo data/i }).click();
  await expect(page.getByText(/reset the demo workspace/i)).toBeVisible();

  // Cancelling must not wipe the shared workspace for other explorers.
  await page.getByRole("button", { name: /keep exploring/i }).click();
  await expect(page.getByText(/reset the demo workspace/i)).toHaveCount(0);
  await expectNotNotFound(page);
});

test("demo: reset restores the seeded workspace", async ({ page }) => {
  await enterDemo(page);

  await page.getByRole("button", { name: /reset demo data/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /reset demo data/i })
    .click();

  // The dialog closes and the workspace is back to its seeded, renderable state.
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 60_000 });
  await expectNotNotFound(page);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
});

test("demo: caregiver alerts deep link renders", async ({ page }) => {
  await enterDemo(page);

  await page.goto("/demo/workspace/caregiver");
  await expectNotNotFound(page);
});
