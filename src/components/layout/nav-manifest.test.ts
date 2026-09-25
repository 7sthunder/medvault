import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ALL_NAV_HREFS, BOTTOM_NAV, NAV_GROUP_ORDER, NAV_ITEMS, SETTINGS_NAV } from "@shared/nav";
import { HELP_CARDS, HELP_FAQS, HELP_SECTIONS } from "@/features/help/help-content";

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
  "/schedule": { owner: "aadhi", phase: 14, existsNow: true },
  "/history": { owner: "bala", phase: 19, existsNow: true },
  "/adherence": { owner: "bala", phase: 16, existsNow: true },
  "/insights": { owner: "hp", phase: 23, existsNow: true },
  "/reports": { owner: "bala", phase: 20, existsNow: true },
  "/caregiver": { owner: "hp", phase: 17, existsNow: true },
  "/notifications": { owner: "hp", phase: 22, existsNow: true },
  "/settings/profile": { owner: "bala", phase: 24, existsNow: true },
  "/settings/reminders": { owner: "bala", phase: 24, existsNow: true },
  "/settings/caregiver": { owner: "bala", phase: 24, existsNow: true },
  "/settings/appearance": { owner: "bala", phase: 24, existsNow: true },
  "/settings/data": { owner: "bala", phase: 24, existsNow: true },
  "/help": { owner: "hp", phase: 30, existsNow: true },
  "/medications/new": { owner: "aadhi", phase: 15, existsNow: true },
  "/medications/[id]": { owner: "aadhi", phase: 15, existsNow: true },
  "/medications/[id]/edit": { owner: "aadhi", phase: 15, existsNow: true },
  "/schedule/[doseId]": { owner: "aadhi", phase: 14 },
  "/adherence/medications": { owner: "bala", phase: 17, existsNow: true },
  "/caregiver/alerts/[id]": { owner: "hp", phase: 17, existsNow: true },
  "/caregiver/accept": { owner: "hp", phase: 17, existsNow: true },
};

const EXPECTED_ROUTE_FILES: Readonly<Record<string, string>> = {
  "/dashboard": "src/app/(app)/dashboard/page.tsx",
  "/medications": "src/app/(app)/medications/page.tsx",
  "/medications/new": "src/app/(app)/medications/new/page.tsx",
  "/medications/[id]": "src/app/(app)/medications/[id]/page.tsx",
  "/medications/[id]/edit": "src/app/(app)/medications/[id]/edit/page.tsx",
  "/adherence": "src/app/(app)/adherence/page.tsx",
  "/adherence/medications": "src/app/(app)/adherence/medications/page.tsx",
  "/insights": "src/app/(app)/insights/page.tsx",
  "/caregiver": "src/app/(app)/caregiver/page.tsx",
  "/caregiver/accept": "src/app/(app)/caregiver/accept/page.tsx",
  "/caregiver/alerts/[id]": "src/app/(app)/caregiver/alerts/[id]/page.tsx",
  "/schedule": "src/app/(app)/schedule/page.tsx",
  "/schedule/[doseId]": "src/app/(app)/schedule/[doseId]/page.tsx",
  "/history": "src/app/(app)/history/page.tsx",
  "/reports": "src/app/(app)/reports/page.tsx",
  "/notifications": "src/app/(app)/notifications/page.tsx",
  "/settings/profile": "src/app/(app)/settings/profile/page.tsx",
  "/settings/reminders": "src/app/(app)/settings/reminders/page.tsx",
  "/settings/caregiver": "src/app/(app)/settings/caregiver/page.tsx",
  "/settings/appearance": "src/app/(app)/settings/appearance/page.tsx",
  "/settings/data": "src/app/(app)/settings/data/page.tsx",
  "/help": "src/app/help/page.tsx",
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

/**
 * Phase 18 landed `/demo` and the consolidated `/help`. `/demo` is not a canonical nav href, so it
 * cannot go in `ROUTE_MANIFEST` without breaking the "no undocumented routes" invariant — but both
 * *are* linked from the marketing footer, the settings data page and the help cards, so a missing
 * file would be a dead link. Pinned explicitly.
 */
const PHASE_18_ROUTE_FILES: readonly string[] = [
  "src/app/help/page.tsx",
  "src/app/(marketing)/demo/page.tsx",
  "src/app/demo/workspace/layout.tsx",
  ...[
    "dashboard",
    "schedule",
    "medications",
    "history",
    "adherence",
    "insights",
    "reports",
    "caregiver",
    "help",
  ].map((screen) => `src/app/demo/workspace/${screen}/page.tsx`),
];

/**
 * Phase 19 — the demo workspace renders the *real* screens, so its shell generates the same nav
 * hrefs a signed-in user gets. Every one of them needs a file under `/demo/workspace`, otherwise a
 * link that works in the app 404s in the demo. Derived from `ALL_NAV_HREFS` so adding a canonical
 * href automatically demands a demo counterpart.
 *
 * `/caregiver/accept` is deliberately excluded: redeeming a caregiver invitation is a
 * session-only procedure (`sessionProcedure`), so a demo subject can never complete it. The demo
 * has no pending invitations to accept either.
 */
const DEMO_WORKSPACE_OMITTED: readonly string[] = ["/caregiver/accept"];

const DEMO_WORKSPACE_ROUTE_FILES: readonly string[] = ALL_NAV_HREFS.filter(
  (href) => !DEMO_WORKSPACE_OMITTED.includes(href),
).map((href) => `src/app/demo/workspace${href === "/help" ? "/help" : href}/page.tsx`);

/**
 * Help cards link to real app screens; `/demo` is the one that lives in the marketing group,
 * because it is a landing page rather than an app screen. Keyed by href so the expectation is
 * explicit — deriving the path from the href silently mis-resolves group-scoped routes.
 */
const HELP_CARD_ROUTE_FILES: Readonly<Record<string, string>> = {
  "/medications/new": "src/app/(app)/medications/new/page.tsx",
  "/settings/reminders": "src/app/(app)/settings/reminders/page.tsx",
  "/settings/appearance": "src/app/(app)/settings/appearance/page.tsx",
  "/caregiver": "src/app/(app)/caregiver/page.tsx",
  "/settings/data": "src/app/(app)/settings/data/page.tsx",
  "/schedule": "src/app/(app)/schedule/page.tsx",
  "/history": "src/app/(app)/history/page.tsx",
  "/adherence": "src/app/(app)/adherence/page.tsx",
  "/insights": "src/app/(app)/insights/page.tsx",
  "/demo": "src/app/(marketing)/demo/page.tsx",
};

describe("phase 18 routes (settings, demo, help) have no dead links", () => {
  it("every file exists", () => {
    for (const file of PHASE_18_ROUTE_FILES) {
      expect(existsSync(path.resolve(process.cwd(), file)), `${file} should exist`).toBe(true);
    }
    for (const file of Object.values(HELP_CARD_ROUTE_FILES)) {
      expect(existsSync(path.resolve(process.cwd(), file)), `${file} should exist`).toBe(true);
    }
  });

  it("every canonical nav href also resolves inside the demo workspace", () => {
    for (const file of DEMO_WORKSPACE_ROUTE_FILES) {
      expect(existsSync(path.resolve(process.cwd(), file)), `${file} should exist`).toBe(true);
    }
  });

  it("the demo workspace root resolves instead of 404ing", () => {
    expect(existsSync(path.resolve(process.cwd(), "src/app/demo/workspace/page.tsx"))).toBe(true);
  });

  it("every href in the help content is a mapped, real screen", () => {
    const hrefs = HELP_CARDS.map((card) => card.href).filter((href): href is string =>
      Boolean(href),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith("/")).toBe(true);
      expect(HELP_CARD_ROUTE_FILES[href], `${href} is not a mapped route`).toBeDefined();
      expect(ROUTE_MANIFEST[href] ?? href === "/demo", `${href} is not a known route`).toBeTruthy();
    }
  });

  it("help content keeps every section and faq addressable", () => {
    expect(HELP_SECTIONS.length).toBeGreaterThan(0);
    for (const card of HELP_CARDS) {
      expect(HELP_SECTIONS.map((s) => s.id)).toContain(card.sectionId);
    }
    for (const faq of HELP_FAQS) {
      expect(faq.question.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(0);
    }
  });
});
