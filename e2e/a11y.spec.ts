import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { enterDemo, expectNotNotFound, registerAndOnboard } from "./helpers";

/**
 * WCAG 2.1 AA automated sweep. axe catches roughly a third of real issues, so this is a floor, not
 * a clearance — but it reliably catches the regressions that actually happened on this project:
 * colour-only status, unnamed icon buttons, and duplicate/omitted landmarks.
 */
async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}

/** Fail with a readable summary — the raw axe payload is thousands of lines. */
function expectNoViolations(results: Awaited<ReturnType<typeof scan>>) {
  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
  }));

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test("marketing + auth pages have no WCAG A/AA violations", async ({ page }) => {
  for (const path of ["/", "/login", "/register", "/help", "/privacy", "/terms"]) {
    await page.goto(path);
    await expectNotNotFound(page);
    expectNoViolations(await scan(page));
  }
});

test("the signed-in shell screens have no WCAG A/AA violations", async ({ page }) => {
  await registerAndOnboard(page, "a11y");

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
    // Let queries settle so skeletons (which legitimately have no content) aren't scanned.
    await page.waitForLoadState("networkidle");
    expectNoViolations(await scan(page));
  }
});

test("the demo workspace has no WCAG A/AA violations", async ({ page }) => {
  await enterDemo(page);

  for (const path of [
    "/demo/workspace/dashboard",
    "/demo/workspace/medications",
    "/demo/workspace/schedule",
    "/demo/workspace/reports",
    "/demo/workspace/settings/profile",
  ]) {
    await page.goto(path);
    await expectNotNotFound(page);
    await page.waitForLoadState("networkidle");
    expectNoViolations(await scan(page));
  }
});

test("every page has exactly one main landmark and one h1", async ({ page }) => {
  await registerAndOnboard(page, "landmarks");

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

    // The shell deliberately does not add a <main>; each screen owns that landmark.
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("icon-only controls carry an accessible name", async ({ page }) => {
  await registerAndOnboard(page, "a11y-names");

  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  const unnamed = await page.locator("button, a[href]").evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const el = node as HTMLElement;
        const label = (
          el.getAttribute("aria-label") ??
          el.getAttribute("title") ??
          el.textContent ??
          ""
        ).trim();
        return label === "";
      })
      .map((node) => (node as HTMLElement).outerHTML.slice(0, 120)),
  );

  expect(unnamed, JSON.stringify(unnamed, null, 2)).toEqual([]);
});
