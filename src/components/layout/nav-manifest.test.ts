import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ALL_NAV_HREFS,
  BOTTOM_NAV,
  NAV_GROUP_ORDER,
  NAV_ITEMS,
  SETTINGS_NAV,
} from "@shared/nav";

interface RouteOwner {
  owner: "aadhi" | "bala" | "hp";
  phase: number;
  /**
   * Route file already committed on `main`/this branch. Routes owned by other
   * tracks land on their branches and merge later — they are no less real, so
   * the manifest pins owner + landing phase instead of requiring the file now.
   */
  existsNow?: boolean;
}

const ROUTE_MANIFEST: Readonly<Record<string, RouteOwner>> = {
  "/dashboard": { owner: "bala", phase: 18, existsNow: true },
  "/medications": { owner: "aadhi", phase: 15, existsNow: true },
  "/schedule": { owner: "aadhi", phase: 14 },
  "/history": { owner: "bala", phase: 19 },
  "/adherence": { owner: "bala", phase: 16, existsNow: true },
  "/insights": { owner: "hp", phase: 23 },
  "/reports": { owner: "bala", phase: 20 },
  "/caregiver": { owner: "hp", phase: 21 },
  "/notifications": { owner: "hp", phase: 22 },
  "/settings/profile": { owner: "bala", phase: 24 },
  "/settings/reminders": { owner: "bala", phase: 24 },
  "/settings/caregiver": { owner: "bala", phase: 24 },
  "/settings/appearance": { owner: "bala", phase: 24 },
  "/settings/data": { owner: "bala", phase: 24 },
  "/help": { owner: "hp", phase: 30 },
  "/medications/new": { owner: "aadhi", phase: 15, existsNow: true },
  "/medications/[id]": { owner: "aadhi", phase: 15, existsNow: true },
  "/medications/[id]/edit": { owner: "aadhi", phase: 15, existsNow: true },
  "/schedule/[doseId]": { owner: "aadhi", phase: 14 },
  "/adherence/medications": { owner: "bala", phase: 17, existsNow: true },
  "/caregiver/alerts/[id]": { owner: "hp", phase: 21 },
  "/caregiver/accept": { owner: "hp", phase: 21 },
};

const EXPECTED_ROUTE_FILES: Readonly<Record<string, string>> = {
  "/dashboard": "src/app/(app)/dashboard/page.tsx",
  "/medications": "src/app/(app)/medications/page.tsx",
  "/medications/new": "src/app/(app)/medications/new/page.tsx",
  "/medications/[id]": "src/app/(app)/medications/[id]/page.tsx",
  "/medications/[id]/edit": "src/app/(app)/medications/[id]/edit/page.tsx",
  "/adherence": "src/app/(app)/adherence/page.tsx",
  "/adherence/medications": "src/app/(app)/adherence/medications/page.tsx",
  "/schedule": "src/app/(app)/schedule/page.tsx",
  "/schedule/[doseId]": "src/app/(app)/schedule/[doseId]/page.tsx",
};

describe("nav model invariants", () => {
  it("nav items have unique, non-empty labels and hrefs in valid groups", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
      expect(NAV_GROUP_ORDER).toContain(item.group);
      expect(item.icon.length).toBeGreaterThan(0);
    }
  });

  it("every declared group renders at least one item", () => {
    for (const group of NAV_GROUP_ORDER) {
      expect(NAV_ITEMS.filter((item) => item.group === group).length).toBeGreaterThan(0);
    }
  });

  it("bottom nav is a 4-slot bar with exactly one add action", () => {
    expect(BOTTOM_NAV).toHaveLength(4);
    const adds = BOTTOM_NAV.filter((item) => item.add);
    expect(adds).toHaveLength(1);
    expect(adds[0]?.href).toBe("/medications/new");
  });

  it("settings nav entries all live under /settings and are unique", () => {
    const hrefs = SETTINGS_NAV.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const item of SETTINGS_NAV) {
      expect(item.href.startsWith("/settings/")).toBe(true);
    }
  });

  it("every item href is present on the canonical href list", () => {
    for (const item of [...NAV_ITEMS, ...SETTINGS_NAV]) {
      expect(ALL_NAV_HREFS).toContain(item.href);
    }
    for (const item of BOTTOM_NAV) {
      if (item.href !== "more") expect(ALL_NAV_HREFS).toContain(item.href);
    }
  });
});

describe("nav route manifest (no dead links)", () => {
  it("documents every canonical href with an owner and landing phase", () => {
    for (const href of ALL_NAV_HREFS) {
      expect(ROUTE_MANIFEST[href]).toBeDefined();
    }
  });

  it("does not document routes that are not canonical nav hrefs", () => {
    for (const href of Object.keys(ROUTE_MANIFEST)) {
      expect(ALL_NAV_HREFS).toContain(href);
    }
  });

  it("route files marked as landed on this branch exist", () => {
    for (const [href, owner] of Object.entries(ROUTE_MANIFEST)) {
      if (!owner.existsNow) continue;
      const file = EXPECTED_ROUTE_FILES[href];
      expect(file, `no file mapping for ${href}`).toBeDefined();
      if (!file) continue;
      expect(existsSync(path.resolve(process.cwd(), file)), `${file} should exist`).toBe(true);
    }
  });
});