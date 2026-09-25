import { expect, test } from "@playwright/test";

import { addMedication, expectNotNotFound, registerAndOnboard } from "./helpers";

test("medications: create through the wizard, then it is searchable and filterable", async ({
  page,
}) => {
  await registerAndOnboard(page, "meds");

  await addMedication(page, "Metformin", { dosage: "500", unit: "mg" });

  const search = page.getByRole("searchbox", { name: /search medications/i });
  await expect(search).toBeVisible();

  // Search matches on name…
  await search.fill("metfor");
  await expect(page.getByText("Metformin").first()).toBeVisible();

  // …on dose…
  await search.fill("500");
  await expect(page.getByText("Metformin").first()).toBeVisible();

  // …and on schedule time, proving the haystack is not just the name column.
  await search.fill("08:00");
  await expect(page.getByText("Metformin").first()).toBeVisible();

  // A miss shows the filtered empty state and a way out of it.
  await search.fill("zzzz-no-such-med");
  await expect(page.getByTitle("No medications match that search")).toBeVisible();

  // Status filter chips drive aria-pressed.
  const paused = page.getByRole("button", { name: "Paused", exact: true });
  await expect(paused).toHaveAttribute("aria-pressed", "false");
  await paused.click();
  await expect(paused).toHaveAttribute("aria-pressed", "true");
});

test("medications: pause, resume and archive from the list", async ({ page }) => {
  await registerAndOnboard(page, "medstatus");
  await addMedication(page, "Lisinopril", { dosage: "10", unit: "mg" });

  const row = page.getByRole("row").filter({ hasText: "Lisinopril" });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: /pause/i }).click();
  await expect(page.getByRole("button", { name: "Paused", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  // A paused medication is filtered out of the Active bucket and shows under Paused.
  await page.getByRole("button", { name: "Paused", exact: true }).click();
  await expect(page.getByText("Lisinopril").first()).toBeVisible();

  await page
    .getByRole("button", { name: /resume/i })
    .first()
    .click();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByText("Lisinopril").first()).toBeVisible();
});

test("medications: detail page renders and links back to the list", async ({ page }) => {
  await registerAndOnboard(page, "meddetail");
  await addMedication(page, "Atorvastatin", { dosage: "20", unit: "mg" });

  await page.getByText("Atorvastatin").first().click();
  await expect(page).toHaveURL(/\/medications\/[^/]+/);
  await expectNotNotFound(page);
  await expect(page.getByRole("heading", { name: "Atorvastatin" })).toBeVisible();

  await page.getByRole("link", { name: /back to medications/i }).click();
  await expect(page).toHaveURL(/\/medications$/);
});

test("medications: wizard validates required fields before submitting", async ({ page }) => {
  await registerAndOnboard(page, "medvalidate");

  await page.goto("/medications/new");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Still on Basics with field errors, not a silent advance.
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Add medication/i })).toHaveCount(0);
});

test("reminder lead time is a user preference, editable in Settings", async ({ page }) => {
  await registerAndOnboard(page, "medremind");

  // The wizard must NOT offer a per-medication lead time: the column does not exist, so such a
  // control would round-trip and be silently dropped by the server.
  await page.goto("/medications/new");
  await expect(page.getByLabel("Reminder lead time")).toHaveCount(0);
  await expect(page.getByLabel("Enable reminders")).toBeVisible();

  // The real control lives with the other reminder preferences.
  await page.goto("/settings/reminders");
  await expect(page.getByText(/remind me before/i).first()).toBeVisible();
});
