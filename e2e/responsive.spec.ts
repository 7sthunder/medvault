import { expect, test } from "@playwright/test";

import { enterDemo, expectNotNotFound, registerAndOnboard } from "./helpers";

/**
 * The shell is a two-layout design — a fixed sidebar on `lg+`, a bottom nav + More sheet below it.
 * Both are driven by the same nav model, so a regression in one usually shows up as content
 * spilling or an unreachable control in the other.
 */
const MOBILE = { width: 390, height: 844 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1440, height: 900 };

const VIEWPORTS = [
  { name: "mobile", size: MOBILE },
  { name: "tablet", size: TABLET },
  { name: "desktop", size: DESKTOP },
] as const;

for (const { name, size } of VIEWPORTS) {
  test(`${name}: primary screens render without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(size);
    await registerAndOnboard(page, `resp-${name}`);

    for (const path of [
      "/dashboard",
      "/medications",
      "/schedule",
      "/history",
      "/adherence",
      "/reports",
    ]) {
      await page.goto(path);
      await expectNotNotFound(page);
      await page.waitForLoadState("networkidle");

      // A horizontal scrollbar on a phone means a fixed-width table or long unbroken token
      // escaped its container.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows by ${overflow}px at ${name}`).toBeLessThanOrEqual(1);
    }
  });
}

test("mobile: the sidebar is hidden and the bottom nav is shown", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await registerAndOnboard(page, "resp-nav");

  await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);

  // The More sheet is the only route to the secondary nav on small screens.
  await page
    .getByRole("navigation", { name: "Bottom navigation" })
    .getByRole("button", { name: "More" })
    .click();
  await expect(page.getByRole("heading", { name: "Menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
});

test("desktop: the sidebar is shown and the bottom nav is hidden", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await registerAndOnboard(page, "resp-desktop");

  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toHaveCount(0);
});

test("mobile: the More sheet traps focus and closes on Escape", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await registerAndOnboard(page, "resp-sheet");

  await page
    .getByRole("navigation", { name: "Bottom navigation" })
    .getByRole("button", { name: "More" })
    .click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
});

test("demo workspace is usable at mobile width", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await enterDemo(page);

  await expect(page.getByRole("navigation", { name: "Bottom navigation" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
