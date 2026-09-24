import { describe, expect, it } from "vitest";

import { getPageContext, isNavItemActive } from "@/components/layout/nav-model";

describe("isNavItemActive", () => {
  it("matches the exact pathname", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/history", "/history")).toBe(true);
    expect(isNavItemActive("/settings/profile", "/settings/profile")).toBe(true);
  });

  it("normalises a trailing slash", () => {
    expect(isNavItemActive("/dashboard", "/dashboard/")).toBe(true);
  });

  it("does not match a different leaf", () => {
    expect(isNavItemActive("/dashboard", "/medications")).toBe(false);
    expect(isNavItemActive("/history", "/history/day")).toBe(false);
  });

  it("matches section roots against their child routes", () => {
    expect(isNavItemActive("/medications", "/medications/new")).toBe(true);
    expect(isNavItemActive("/medications", "/medications/abc-123")).toBe(true);
    expect(isNavItemActive("/medications", "/medications/abc-123/edit")).toBe(true);
    expect(isNavItemActive("/schedule", "/schedule/dose-123")).toBe(true);
    expect(isNavItemActive("/caregiver", "/caregiver/accept")).toBe(true);
    expect(isNavItemActive("/adherence", "/adherence/medications")).toBe(true);
  });

  it("matches the settings item for every /settings child", () => {
    expect(isNavItemActive("/settings/profile", "/settings/profile")).toBe(true);
    expect(isNavItemActive("/settings/profile", "/settings/reminders")).toBe(true);
    expect(isNavItemActive("/settings/profile", "/settings/caregiver")).toBe(true);
    expect(isNavItemActive("/settings/profile", "/settings/appearance")).toBe(true);
    expect(isNavItemActive("/settings/profile", "/settings/data")).toBe(true);
  });

  it("does not treat a bare /settings prefix as active", () => {
    expect(isNavItemActive("/settings/profile", "/settings")).toBe(false);
  });
});

describe("getPageContext", () => {
  it("resolves the dashboard to a single crumb", () => {
    expect(getPageContext("/dashboard")).toEqual({
      title: "Dashboard",
      crumbs: [{ label: "Dashboard" }],
    });
  });

  it("resolves a top-level nav section with a Home crumb", () => {
    expect(getPageContext("/history")).toEqual({
      title: "History",
      crumbs: [{ label: "Home", href: "/dashboard" }, { label: "History" }],
    });
  });

  it("resolves settings children under a Settings crumb", () => {
    expect(getPageContext("/settings/reminders")).toEqual({
      title: "Reminders",
      crumbs: [
        { label: "Home", href: "/dashboard" },
        { label: "Settings", href: "/settings/profile" },
        { label: "Reminders" },
      ],
    });
  });

  it("resolves medication child routes to the section title and a child label", () => {
    expect(getPageContext("/medications/new")).toEqual({
      title: "Medications",
      crumbs: [
        { label: "Home", href: "/dashboard" },
        { label: "Medications", href: "/medications" },
        { label: "New" },
      ],
    });
    expect(getPageContext("/medications/0193f8a2-1234-7000-8000-000000000000")).toEqual({
      title: "Medications",
      crumbs: [
        { label: "Home", href: "/dashboard" },
        { label: "Medications", href: "/medications" },
        { label: "Details" },
      ],
    });
  });

  it("resolves schedule dose detail pages", () => {
    const ctx = getPageContext("/schedule/0193f8a2-1234-7000-8000-000000000000");
    expect(ctx.title).toBe("Today's Schedule");
    expect(ctx.crumbs[2]).toEqual({ label: "Details" });
  });

  it("falls back to a humanised title for unknown routes", () => {
    expect(getPageContext("/some-page")).toEqual({
      title: "Some page",
      crumbs: [{ label: "Home", href: "/dashboard" }, { label: "Some page" }],
    });
  });
});