import { test, expect } from "@playwright/test";

test("design system catalogue renders Stitch stories + status chips", async ({ page }) => {
  await page.goto("/design-system");

  await expect(
    page.getByRole("heading", { name: "One token set, one component language." }),
  ).toBeVisible();

  // §12: all 8 status chips render (never colour-only)
  await expect(page.locator("[data-slot='chip']").first()).toBeVisible();
  await expect(
    page.locator("[data-slot='status'] [data-slot='status-badge']"),
  ).toHaveCount(8);

  // medication story uses §2 cards + list rows
  await expect(page.locator("[data-slot='list-row']").first()).toBeVisible();
  await expect(page.getByText("Metformin 500mg").first()).toBeVisible();
});

test("design system catalogue shows the token swatches", async ({ page }) => {
  await page.goto("/design-system");

  await expect(page.getByText("--color-primary", { exact: true })).toBeVisible();
  await expect(page.getByText("--shadow-card", { exact: true })).toBeVisible();
  await expect(page.getByText("#10b981", { exact: false }).first()).toBeVisible();
});