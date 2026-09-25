/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdherenceSummaryDTO } from "@/shared/types";
import { AdherenceNavTabs } from "./AdherenceNavTabs";
import { MissedHeatStrip } from "./MissedHeatStrip";
import { StatRail } from "./StatRail";
import { TimeOfDayPattern } from "./TimeOfDayPattern";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/adherence",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("Phase 17 — Adherence UI Components", () => {
  const sampleSummary: AdherenceSummaryDTO = {
    from: new Date("2026-02-01T00:00:00Z"),
    to: new Date("2026-03-01T00:00:00Z"),
    scheduled: 84,
    taken: 76,
    missed: 5,
    skipped: 3,
    snoozed: 8,
    adherencePercent: 90.5,
    days: [
      {
        date: "2026-02-27",
        scheduled: 2,
        taken: 2,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
      {
        date: "2026-02-28",
        scheduled: 2,
        taken: 1,
        missed: 1,
        skipped: 0,
        snoozed: 1,
        adherencePercent: 50,
        streakDay: false,
      },
      {
        date: "2026-03-01",
        scheduled: 0,
        taken: 0,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: null,
        streakDay: false,
      },
    ],
    streak: {
      current: 7,
      longest: 7,
      currentEndsToday: true,
    },
    trend: {
      daily: [],
      rolling7: [],
      direction: "improving",
      current7: 92.5,
      prior7: 88.0,
    },
    byBucket: [
      { bucket: "morning", scheduled: 40, taken: 40, missed: 0, rate: 100 },
      { bucket: "afternoon", scheduled: 14, taken: 10, missed: 4, rate: 71.4 },
      { bucket: "evening", scheduled: 30, taken: 26, missed: 1, rate: 86.7 },
      { bucket: "night", scheduled: 0, taken: 0, missed: 0, rate: null },
    ],
  };

  describe("StatRail", () => {
    it("renders sample metrics: 90.5% rate, 7-day streak, 76 taken, 5 / 3 missed/skipped", () => {
      render(<StatRail summary={sampleSummary} />);

      expect(screen.getByText("90.5%")).toBeInTheDocument();
      expect(screen.getByText("76 of 84 doses taken")).toBeInTheDocument();

      expect(screen.getByText("7 days")).toBeInTheDocument();
      expect(screen.getByText("Best run: 7 days")).toBeInTheDocument();

      expect(screen.getByText("76")).toBeInTheDocument();
      expect(screen.getByText("8 snoozed prior")).toBeInTheDocument();

      expect(screen.getByText("5 / 3")).toBeInTheDocument();
      expect(screen.getByText("Trend improving vs prior")).toBeInTheDocument();
    });
  });

  describe("TimeOfDayPattern", () => {
    it("renders morning, afternoon, evening, and night buckets with rates", () => {
      render(<TimeOfDayPattern patterns={sampleSummary.byBucket} />);

      expect(screen.getByText("Morning")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();

      expect(screen.getByText("Afternoon")).toBeInTheDocument();
      expect(screen.getByText("71.4%")).toBeInTheDocument();

      expect(screen.getByText("Evening")).toBeInTheDocument();
      expect(screen.getByText("86.7%")).toBeInTheDocument();

      expect(screen.getByText("Night")).toBeInTheDocument();
      expect(screen.getByText("No data")).toBeInTheDocument();
    });
  });

  describe("MissedHeatStrip", () => {
    it("renders calendar strip with legend labels", () => {
      render(<MissedHeatStrip days={sampleSummary.days} />);

      expect(screen.getByText(/Adherence Calendar Strip/i)).toBeInTheDocument();
      expect(screen.getByText("Adherent")).toBeInTheDocument();
      expect(screen.getByText("Partial / Skipped")).toBeInTheDocument();
      expect(screen.getByText("Missed")).toBeInTheDocument();
      expect(screen.getByText("Rest Day")).toBeInTheDocument();
    });
  });

  describe("AdherenceNavTabs", () => {
    it("renders navigation links for Overview and By Medication", () => {
      render(<AdherenceNavTabs />);

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("By Medication")).toBeInTheDocument();
    });
  });
});
