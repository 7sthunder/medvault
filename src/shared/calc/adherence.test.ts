import { describe, expect, it } from "vitest";
import {
  bucketOfHour,
  calculateAdherencePercent,
  calculateTimeBucketStats,
} from "./adherence";
import { calculateMedicationPerformance, calculateTrend } from "./performance";
import { calculateStreaks } from "./streaks";

describe("Phase 16 — Adherence calculation engines", () => {
  describe("Adherence rate & time buckets", () => {
    it("computes exact sample figures: 76 taken out of 84 scheduled = 90.5%", () => {
      // 84 scheduled (76 taken + 5 missed + 3 skipped)
      const rate = calculateAdherencePercent(76, 84);
      expect(rate).toBe(90.5);
    });

    it("returns null for empty period with 0 doses", () => {
      expect(calculateAdherencePercent(0, 0)).toBeNull();
    });

    it("identifies correct time buckets according to 24h boundaries", () => {
      expect(bucketOfHour(8)).toBe("morning");
      expect(bucketOfHour(11)).toBe("morning");
      expect(bucketOfHour(12)).toBe("afternoon");
      expect(bucketOfHour(16)).toBe("afternoon");
      expect(bucketOfHour(17)).toBe("evening");
      expect(bucketOfHour(20)).toBe("evening");
      expect(bucketOfHour(21)).toBe("night");
      expect(bucketOfHour(23)).toBe("night");
    });

    it("aggregates bucket counts and rates across doses", () => {
      const doses = [
        { scheduledFor: new Date("2026-03-01T08:00:00Z"), status: "taken" },
        { scheduledFor: new Date("2026-03-01T14:00:00Z"), status: "missed" },
        { scheduledFor: new Date("2026-03-01T19:00:00Z"), status: "taken" },
        { scheduledFor: new Date("2026-03-01T22:00:00Z"), status: "upcoming" }, // excluded (not resolved)
      ];

      const stats = calculateTimeBucketStats(doses, "UTC");
      expect(stats).toHaveLength(4);

      const morning = stats.find((s) => s.bucket === "morning")!;
      expect(morning.scheduled).toBe(1);
      expect(morning.taken).toBe(1);
      expect(morning.rate).toBe(100);

      const afternoon = stats.find((s) => s.bucket === "afternoon")!;
      expect(afternoon.scheduled).toBe(1);
      expect(afternoon.missed).toBe(1);
      expect(afternoon.rate).toBe(0);

      const night = stats.find((s) => s.bucket === "night")!;
      expect(night.scheduled).toBe(0);
      expect(night.rate).toBeNull();
    });
  });

  describe("Streak calculations", () => {
    it("computes 7-day current streak for consecutive adherent days", () => {
      const days = [
        { date: "2026-02-23", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-24", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-25", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-26", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-27", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-28", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-03-01", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
      ];

      const streaks = calculateStreaks(days, { todayKey: "2026-03-01", isTodayAdherentSoFar: true });
      expect(streaks.current).toBe(7);
      expect(streaks.longest).toBe(7);
      expect(streaks.currentEndsToday).toBe(true);
    });

    it("preserves streaks across rest days (scheduled = 0)", () => {
      const days = [
        { date: "2026-02-25", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-26", scheduled: 0, taken: 0, missed: 0, skipped: 0 }, // Rest day
        { date: "2026-02-27", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-28", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
      ];

      const streaks = calculateStreaks(days);
      // 3 adherent days separated by 1 rest day -> current streak is 3
      expect(streaks.current).toBe(3);
    });

    it("resets current streak when a missed dose occurs", () => {
      const days = [
        { date: "2026-02-25", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-26", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
        { date: "2026-02-27", scheduled: 2, taken: 1, missed: 1, skipped: 0 }, // Missed!
        { date: "2026-02-28", scheduled: 2, taken: 2, missed: 0, skipped: 0 },
      ];

      const streaks = calculateStreaks(days);
      expect(streaks.current).toBe(1);
      expect(streaks.longest).toBe(2);
    });
  });

  describe("Trend & Medication performance", () => {
    it("computes rolling 7-day average and trend direction", () => {
      const series = [
        { date: "2026-02-20", adherencePercent: 80 },
        { date: "2026-02-21", adherencePercent: 80 },
        { date: "2026-02-22", adherencePercent: 80 },
        { date: "2026-02-23", adherencePercent: 80 },
        { date: "2026-02-24", adherencePercent: 80 },
        { date: "2026-02-25", adherencePercent: 80 },
        { date: "2026-02-26", adherencePercent: 80 }, // prior 7 avg: 80
        { date: "2026-02-27", adherencePercent: 100 },
        { date: "2026-02-28", adherencePercent: 100 },
        { date: "2026-03-01", adherencePercent: 100 },
        { date: "2026-03-02", adherencePercent: 100 },
        { date: "2026-03-03", adherencePercent: 100 },
        { date: "2026-03-04", adherencePercent: 100 },
        { date: "2026-03-05", adherencePercent: 100 }, // current 7 avg: 100
      ];

      const trend = calculateTrend(series);
      expect(trend.prior7).toBe(80);
      expect(trend.current7).toBe(100);
      expect(trend.direction).toBe("improving");
      expect(trend.rolling7).toHaveLength(14);
    });

    it("computes per-medication performance with best and worst buckets", () => {
      const medications = [
        {
          id: "med-1",
          name: "Metformin",
          color: "var(--color-emerald-500)",
          frequencyLabel: "twice-daily" as const,
        },
      ];

      const doses = [
        {
          medicationId: "med-1",
          status: "taken",
          scheduledFor: new Date("2026-03-01T08:00:00Z"),
          takenAt: new Date("2026-03-01T08:05:00Z"),
        },
        {
          medicationId: "med-1",
          status: "missed",
          scheduledFor: new Date("2026-03-01T20:00:00Z"),
        },
      ];

      const perf = calculateMedicationPerformance(medications, doses, "UTC");
      expect(perf).toHaveLength(1);
      expect(perf[0]?.scheduled).toBe(2);
      expect(perf[0]?.taken).toBe(1);
      expect(perf[0]?.missed).toBe(1);
      expect(perf[0]?.adherencePercent).toBe(50);
      expect(perf[0]?.bestBucket).toBe("morning");
      expect(perf[0]?.worstBucket).toBe("evening");
      expect(perf[0]?.lastTakenAt).toEqual(new Date("2026-03-01T08:05:00Z"));
    });
  });
});
