import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_NAV_HREFS,
  BOTTOM_NAV,
  NAV_GROUP_ORDER,
  NAV_ITEMS,
  SETTINGS_NAV,
} from "./nav";

describe("Phase 09 — Navigation model & route validation", () => {
  it("every nav item belongs to an ordered nav group", () => {
    for (const item of NAV_ITEMS) {
      expect(NAV_GROUP_ORDER).toContain(item.group);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("BOTTOM_NAV has 5 mobile items matching the grill-me design spec", () => {
    expect(BOTTOM_NAV).toHaveLength(5);
    const labels = BOTTOM_NAV.map((i) => i.label);
    expect(labels).toEqual(["Schedule", "Medications", "Dashboard", "Adherence", "More"]);
  });

  it("SETTINGS_NAV maps all 5 planned settings sections", () => {
    expect(SETTINGS_NAV).toHaveLength(5);
    const labels = SETTINGS_NAV.map((s) => s.label);
    expect(labels).toEqual(["Profile", "Reminders", "Caregiver", "Appearance", "Your data"]);
  });

  it("ALL_NAV_HREFS contains every href from NAV_ITEMS and SETTINGS_NAV", () => {
    for (const item of NAV_ITEMS) {
      expect(ALL_NAV_HREFS).toContain(item.href);
    }
    for (const item of SETTINGS_NAV) {
      expect(ALL_NAV_HREFS).toContain(item.href);
    }
  });

  it("DoD: every href in ALL_NAV_HREFS resolves to an existing page route file", () => {
    const appDir = resolve(process.cwd(), "src/app/(app)");

    for (const href of ALL_NAV_HREFS) {
      // Convert href to path under src/app/(app)
      // e.g. /dashboard -> src/app/(app)/dashboard/page.tsx
      // e.g. /medications/[id] -> src/app/(app)/medications/[id]/page.tsx
      const relativePath = href.replace(/^\//, "");
      const pagePath = resolve(appDir, relativePath, "page.tsx");
      const exists = existsSync(pagePath);
      expect(
        exists,
        `Expected route file to exist for href "${href}" at path: ${pagePath}`,
      ).toBe(true);
    }
  });
});
