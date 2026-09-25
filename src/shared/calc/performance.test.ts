/**
 * Phase 27 — exhaustive tests for performance.ts (plan §18).
 * Targets the uncovered lines: 30 (null rolling bucket), 60-63 (stable branch), 129 (takenAt sort).
 */
import { describe, expect, it } from "vitest";
import { calculateTrend, calculateMedicationPerformance } from "./performance";
import type { TrendDayInput } from "./performance";

// ---------------------------------------------------------------------------
// calculateTrend
// ---------------------------------------------------------------------------
describe("calculateTrend", () => {
  it("returns stable/null with empty input", () => {
    const result = calculateTrend([]);
    expect(result.direction).toBe("stable");
    expect(result.current7).toBeNull();
    expect(result.prior7).toBeNull();
    expect(result.daily).toHaveLength(0);
    expect(result.rolling7).toHaveLength(0);
  });

  it("returns null rolling value when all days in window have null adherence", () => {
    const days: TrendDayInput[] = [
      { date: "2024-01-01", adherencePercent: null },
      { date: "2024-01-02", adherencePercent: null },
    ];
    const result = calculateTrend(days);
    expect(result.rolling7.every((r) => r.value === null)).toBe(true);
    expect(result.direction).toBe("stable");
  });

  it("computes rolling 7-day average correctly", () => {
    // 10 days, all 100 → rolling avg should be 100
    const days: TrendDayInput[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      adherencePercent: 100,
    }));
    const result = calculateTrend(days);
    expect(result.rolling7[9]?.value).toBe(100);
  });

  it("returns improving direction when current 7-day avg > prior by >2", () => {
    // prior 7 days: 60%, current 7 days: 90% → diff = 30 → improving
    const days: TrendDayInput[] = [
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, "0")}`,
        adherencePercent: 60,
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${String(i + 8).padStart(2, "0")}`,
        adherencePercent: 90,
      })),
    ];
    const result = calculateTrend(days);
    expect(result.direction).toBe("improving");
    expect(result.current7).toBe(90);
    expect(result.prior7).toBe(60);
  });

  it("returns declining direction when current 7-day avg < prior by >2", () => {
    const days: TrendDayInput[] = [
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, "0")}`,
        adherencePercent: 90,
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${String(i + 8).padStart(2, "0")}`,
        adherencePercent: 60,
      })),
    ];
    const result = calculateTrend(days);
    expect(result.direction).toBe("declining");
  });

  it("returns stable direction when diff is within ±2", () => {
    // prior 7: 80, current 7: 81 → diff = 1 → stable
    const days: TrendDayInput[] = [
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, "0")}`,
        adherencePercent: 80,
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-${String(i + 8).padStart(2, "0")}`,
        adherencePercent: 81,
      })),
    ];
    const result = calculateTrend(days);
    expect(result.direction).toBe("stable");
  });

  it("returns stable when fewer than 8 non-null days (no prior7)", () => {
    const days: TrendDayInput[] = Array.from({ length: 5 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      adherencePercent: 80,
    }));
    const result = calculateTrend(days);
    expect(result.direction).toBe("stable");
    expect(result.prior7).toBeNull();
    expect(result.current7).not.toBeNull();
  });

  it("sorts unsorted input before calculating", () => {
    const days: TrendDayInput[] = [
      { date: "2024-01-03", adherencePercent: 90 },
      { date: "2024-01-01", adherencePercent: 90 },
      { date: "2024-01-02", adherencePercent: 90 },
    ];
    const result = calculateTrend(days);
    expect(result.daily[0]?.date).toBe("2024-01-01");
    expect(result.daily[2]?.date).toBe("2024-01-03");
  });
});

// ---------------------------------------------------------------------------
// calculateMedicationPerformance
// ---------------------------------------------------------------------------
describe("calculateMedicationPerformance", () => {
  const med = { id: "m1", name: "Aspirin", color: "#ff0000", frequencyLabel: "once-daily" as const };

  it("returns zero stats for medication with no doses", () => {
    const result = calculateMedicationPerformance([med], [], "UTC");
    expect(result).toHaveLength(1);
    const r = result[0]!;
    expect(r.scheduled).toBe(0);
    expect(r.taken).toBe(0);
    expect(r.adherencePercent).toBe(null);
    expect(r.lastTakenAt).toBeNull();
    expect(r.bestBucket).toBeNull();
    expect(r.worstBucket).toBeNull();
  });

  it("calculates adherence percent correctly", () => {
    const now = new Date("2024-03-01T08:00:00Z");
    const doses = [
      { medicationId: "m1", status: "taken", scheduledFor: now, takenAt: now },
      { medicationId: "m1", status: "taken", scheduledFor: now, takenAt: now },
      { medicationId: "m1", status: "missed", scheduledFor: now },
      { medicationId: "m1", status: "skipped", scheduledFor: now },
    ];
    const result = calculateMedicationPerformance([med], doses, "UTC");
    expect(result[0]!.taken).toBe(2);
    expect(result[0]!.missed).toBe(1);
    expect(result[0]!.skipped).toBe(1);
    expect(result[0]!.scheduled).toBe(4);
    expect(result[0]!.adherencePercent).toBe(50);
  });

  it("picks lastTakenAt as the most recent takenAt among taken doses", () => {
    const d1 = new Date("2024-01-10T08:00:00Z");
    const d2 = new Date("2024-01-15T08:00:00Z");
    const doses = [
      { medicationId: "m1", status: "taken", scheduledFor: d1, takenAt: d1 },
      { medicationId: "m1", status: "taken", scheduledFor: d2, takenAt: d2 },
    ];
    const result = calculateMedicationPerformance([med], doses, "UTC");
    expect(result[0]!.lastTakenAt?.toISOString()).toBe(d2.toISOString());
  });

  it("only considers resolved doses (taken/missed/skipped) for scheduled count", () => {
    const now = new Date("2024-03-01T08:00:00Z");
    const doses = [
      { medicationId: "m1", status: "taken", scheduledFor: now, takenAt: now },
      { medicationId: "m1", status: "upcoming", scheduledFor: now },
      { medicationId: "m1", status: "due-now", scheduledFor: now },
    ];
    const result = calculateMedicationPerformance([med], doses, "UTC");
    expect(result[0]!.scheduled).toBe(1); // only 'taken' is resolved
  });

  it("returns empty array for no medications", () => {
    const result = calculateMedicationPerformance([], [], "UTC");
    expect(result).toHaveLength(0);
  });

  it("filters doses correctly per medication when multiple meds exist", () => {
    const med2 = { id: "m2", name: "Lisinopril", color: "#0000ff", frequencyLabel: "twice-daily" as const };
    const now = new Date("2024-03-01T08:00:00Z");
    const doses = [
      { medicationId: "m1", status: "taken", scheduledFor: now, takenAt: now },
      { medicationId: "m2", status: "missed", scheduledFor: now },
    ];
    const result = calculateMedicationPerformance([med, med2], doses, "UTC");
    expect(result[0]!.adherencePercent).toBe(100); // m1: 1 taken / 1 = 100%
    expect(result[1]!.adherencePercent).toBe(0);   // m2: 0 taken / 1 = 0%
  });
});
