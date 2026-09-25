import { describe, expect, it } from "vitest";

import { adherencePercent, bucketStats, computeTrend, round1dp, sumCounts } from "./adherence";
import { medicationPerformance } from "./performance";
import { computeStreaks } from "./streaks";

const iso = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00Z`);

describe("adherencePercent (§10.5)", () => {
  it("reproduces the exact §19 sample: 76/84 → 90.5% (1dp)", () => {
    expect(adherencePercent({ taken: 76, missed: 5, skipped: 3 })).toBe(90.5);
  });

  it("rounds 1dp via Math.round(x*10)/10", () => {
    expect(round1dp((76 / 84) * 100)).toBe(90.5);
    expect(round1dp(12.345)).toBe(12.3);
  });

  it("skipped doses reduce adherence (match the shared denominator)", () => {
    expect(adherencePercent({ taken: 76, missed: 5, skipped: 3 })).toBe(adherencePercent({ taken: 76, missed: 8, skipped: 0 }));
  });

  it("returns null for an empty period (no required doses)", () => {
    expect(adherencePercent({ taken: 0, missed: 0, skipped: 0 })).toBeNull();
  });

  it("sumCounts aggregates day rows", () => {
    const sum = sumCounts([
      { scheduled: 4, taken: 3, missed: 0, skipped: 1, snoozed: 1 },
      { scheduled: 5, taken: 4, missed: 1, skipped: 0, snoozed: 0 },
    ]);
    expect(sum).toEqual({ scheduled: 9, taken: 7, missed: 1, skipped: 1, snoozed: 1 });
  });
});

describe("computeStreaks (§10.5)", () => {
  it("7-day current + longest streak when the last 7 days are perfect", () => {
    const perfect = (day: number) => ({
      date: `2026-01-${String(day).padStart(2, "0")}`,
      scheduled: 2,
      missed: 0,
      skipped: 0,
    });
    const days = [
      { date: "2026-01-04", scheduled: 2, missed: 2, skipped: 0 }, // breaks the streak
      perfect(5),
      perfect(6),
      perfect(7),
      perfect(8),
      perfect(9),
      perfect(10),
      perfect(11),
    ];
    expect(computeStreaks(days, "2026-01-11")).toEqual({ current: 7, longest: 7, currentEndsToday: false });
  });

  it("in-progress today counts toward current but not longest", () => {
    const days = [
      { date: "2026-01-09", scheduled: 2, missed: 0, skipped: 0 },
      { date: "2026-01-10", scheduled: 2, missed: 0, skipped: 0 },
      { date: "2026-01-11", scheduled: 2, missed: 0, skipped: 0, inProgress: true },
    ];
    expect(computeStreaks(days, "2026-01-11")).toEqual({ current: 3, longest: 2, currentEndsToday: true });
  });

  it("non-regimen days do not break the streak", () => {
    const days = [
      { date: "2026-01-08", scheduled: 2, missed: 0, skipped: 0 },
      { date: "2026-01-09", scheduled: 0, missed: 0, skipped: 0 }, // gap
      { date: "2026-01-10", scheduled: 2, missed: 0, skipped: 0 },
      { date: "2026-01-11", scheduled: 2, missed: 0, skipped: 0 },
    ];
    expect(computeStreaks(days, "2026-01-11")).toEqual({ current: 3, longest: 3, currentEndsToday: false });
  });

  it("a missed day ends the current streak", () => {
    const days = [
      { date: "2026-01-10", scheduled: 2, missed: 0, skipped: 0 },
      { date: "2026-01-11", scheduled: 2, missed: 1, skipped: 0 },
    ];
    expect(computeStreaks(days, "2026-01-11")).toEqual({ current: 0, longest: 1, currentEndsToday: false });
  });
});

describe("bucketStats (§10.5)", () => {
  const events = [
    { scheduledFor: iso("2026-01-10", "08:00"), status: "taken" as const, snoozeCount: 0 },
    { scheduledFor: iso("2026-01-10", "20:00"), status: "missed" as const, snoozeCount: 0 },
    { scheduledFor: iso("2026-01-10", "10:00"), status: "taken" as const, snoozeCount: 1 },
    { scheduledFor: iso("2026-01-11", "13:00"), status: "taken" as const, snoozeCount: 0 },
  ];
  const stats = bucketStats(events, "UTC");

  it("buckets by §10.5 edges (Morning <12, Afternoon 12–17, Evening 17–21, Night ≥21)", () => {
    const morning = stats.find((s) => s.bucket === "morning")!;
    const afternoon = stats.find((s) => s.bucket === "afternoon")!;
    const evening = stats.find((s) => s.bucket === "evening")!;
    expect(morning).toMatchObject({ scheduled: 2, taken: 2, missed: 0, rate: 100 });
    expect(afternoon).toMatchObject({ scheduled: 1, taken: 1, rate: 100 });
    expect(evening).toMatchObject({ scheduled: 1, missed: 1, rate: 0 });
    expect(stats.find((s) => s.bucket === "night")!.scheduled).toBe(0);
  });
});

describe("computeTrend (§10.5)", () => {
  it("reports improving when the last 7 days beat the prior 7", () => {
    const days = [
      ...Array.from({ length: 7 }, (_, i) => ({ date: `2026-01-0${i + 1}`, adherencePercent: 80 })),
      ...Array.from({ length: 7 }, (_, i) => ({ date: `2026-01-1${i}`, adherencePercent: 100 })),
    ];
    const trend = computeTrend(days, "2026-01-16");
    expect(trend.direction).toBe("improving");
    expect(trend.current7).toBe(100);
    expect(trend.prior7).toBe(80);
    expect(trend.rolling7[trend.rolling7.length - 1]).toEqual({ date: "2026-01-16", value: 100 });
  });

  it("missing data days do not distort the rolling average", () => {
    const days = [
      { date: "2026-01-01", adherencePercent: null },
      { date: "2026-01-02", adherencePercent: 100 },
      { date: "2026-01-03", adherencePercent: 50 },
    ];
    expect(computeTrend(days, "2026-01-02").rolling7[1]).toEqual({ date: "2026-01-02", value: 100 });
  });
});

describe("medicationPerformance (§10.5)", () => {
  it("aggregates per-med counts, best/worst bucket and last taken", () => {
    const rows = medicationPerformance(
      [
        {
          id: "m1",
          name: "Metformin",
          color: "#10b981",
          frequencyLabel: "twice-daily",
          events: [
            { status: "taken", scheduledFor: iso("2026-01-08", "08:00"), takenAt: iso("2026-01-08", "08:05"), snoozeCount: 0 },
            { status: "taken", scheduledFor: iso("2026-01-08", "20:00"), takenAt: iso("2026-01-08", "20:10"), snoozeCount: 1 },
            { status: "missed", scheduledFor: iso("2026-01-09", "20:00"), takenAt: null, snoozeCount: 0 },
          ],
        },
      ],
      "UTC",
    );
    expect(rows[0]).toMatchObject({
      medicationId: "m1",
      scheduled: 3,
      taken: 2,
      missed: 1,
      skipped: 0,
      adherencePercent: round1dp((2 / 3) * 100),
      bestBucket: "morning",
      worstBucket: "evening",
      lastTakenAt: new Date("2026-01-08T20:10:00Z"),
    });
  });
});