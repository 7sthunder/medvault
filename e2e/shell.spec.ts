import { expect, test } from "@playwright/test";

import { expectNotNotFound, registerAndOnboard } from "./helpers";

/**
 * The shell spec used to assert `expect(page.getByRole("heading", { name: "404" })).toBeVisible()`
 * after clicking "Today's Schedule" and "Schedule". That was written when those routes did not
 * exist yet, and it was actively harmful: the nav link shipped, the test still passed, and a
 * click-through 404 looked green. Both now assert the opposite — a real screen, not a 404.
 */
test("desktop shell: sidebar nav, shell persistence and profile menu", async ({ page }) => {
  const email = await registerAndOnboard(page, "shell");

  const sidebar = page.getByRole("navigation", { name: "Main navigation" });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(sidebar.getByRole("link", { name: "Medications" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Today's Schedule" })).toBeVisible();

  // Onboarding is finished; revisiting it must bounce back rather than re-prompt.
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.goto("/dashboard");
  await expect(sidebar.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Every sidebar href must land on a real screen, not the catch-all 404.
  for (const label of [
    "Medications",
    "Today's Schedule",
    "History",
    "Adherence",
    "AI Insights",
    "Reports",
    "Caregiver",
    "Help",
  ]) {
    await page.goto("/dashboard");
    await sidebar.getByRole("link", { name: label }).click();
    await expectNotNotFound(page);
  }

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open profile menu" }).click();
  const profileMenu = page.getByRole("menu", { name: "Open profile menu" });
  await expect(profileMenu.getByText(email)).toBeVisible();
  await expect(profileMenu.getByRole("menuitem", { name: /Settings/i })).toBeVisible();

  await page.getByRole("menuitem", { name: /Sign out/i }).click();
  await expect(page).toHaveURL("/");
});

test("every canonical nav href resolves to a real route", async ({ page }) => {
  await registerAndOnboard(page, "nav");

  const hrefs = await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? ""),
    );

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect(href).not.toBeNull();
    await page.goto(href!);
    await expectNotNotFound(page);
  }
});

test("mobile shell: bottom nav and More sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndOnboard(page, "mobile");

  const bottomNav = page.getByRole("navigation", { name: "Bottom navigation" });
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Home" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await bottomNav.getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL(/\/schedule/);
  await expectNotNotFound(page);

  await page.goto("/dashboard");
  await bottomNav.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("heading", { name: "Menu" })).toBeVisible();
  await expect(page.getByText("Everything in your vault.")).toBeVisible();

  await page.getByRole("link", { name: "Notifications" }).click();
  await expect(page).toHaveURL(/\/notifications/);
  await expectNotNotFound(page);
});

test("keyboard: skip link is the first tab stop and reaches main content", async ({ page }) => {
  await registerAndOnboard(page, "kbd");

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /skip to (main )?content/i });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main-content|#main/);
});
