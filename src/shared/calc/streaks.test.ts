/**
 * Phase 27 — exhaustive tests for streaks.ts (plan §18).
 * Targets uncovered lines: 33 (empty), 78-86 (today rest day + broken streak branches).
 */
import { describe, expect, it } from "vitest";
import { calculateStreaks } from "./streaks";
import type { DayStreakInput } from "./streaks";

function day(date: string, scheduled: number, taken: number, missed: number, skipped: number): DayStreakInput {
  return { date, scheduled, taken, missed, skipped };
}

describe("calculateStreaks", () => {
  it("returns zero everything for empty input", () => {
    expect(calculateStreaks([])).toEqual({ current: 0, longest: 0, currentEndsToday: false });
  });

  it("single perfect day gives current=1, longest=1", () => {
    const result = calculateStreaks([day("2024-01-01", 2, 2, 0, 0)]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it("single day with missed gives current=0, longest=0", () => {
    const result = calculateStreaks([day("2024-01-01", 2, 1, 1, 0)]);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
  });

  it("consecutive perfect days produce correct current streak", () => {
    const result = calculateStreaks([
      day("2024-01-01", 1, 1, 0, 0),
      day("2024-01-02", 1, 1, 0, 0),
      day("2024-01-03", 1, 1, 0, 0),
    ]);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("rest days (scheduled=0) do not break the streak but are not counted", () => {
    const result = calculateStreaks([
      day("2024-01-01", 1, 1, 0, 0),
      day("2024-01-02", 0, 0, 0, 0), // rest day — does not break or increment
      day("2024-01-03", 1, 1, 0, 0),
    ]);
    // 2 in-regimen adherent days (rest day is not counted but does not reset)
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });

  it("missed dose breaks streak and current resets", () => {
    const result = calculateStreaks([
      day("2024-01-01", 1, 1, 0, 0),
      day("2024-01-02", 1, 1, 0, 0),
      day("2024-01-03", 1, 0, 1, 0), // missed
      day("2024-01-04", 1, 1, 0, 0),
    ]);
    expect(result.current).toBe(1); // only day 4
    expect(result.longest).toBe(2); // days 1-2
  });

  it("skipped dose breaks streak", () => {
    const result = calculateStreaks([
      day("2024-01-01", 1, 1, 0, 0),
      day("2024-01-02", 1, 0, 0, 1), // skipped
      day("2024-01-03", 1, 1, 0, 0),
    ]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it("todayKey marks today as active and sets currentEndsToday", () => {
    const result = calculateStreaks(
      [
        day("2024-01-01", 1, 1, 0, 0),
        day("2024-01-02", 1, 1, 0, 0),
        day("2024-01-03", 1, 1, 0, 0), // today in progress
      ],
      { todayKey: "2024-01-03", isTodayAdherentSoFar: true },
    );
    expect(result.current).toBe(3);
    expect(result.currentEndsToday).toBe(true);
  });

  it("today is a rest day (scheduled=0): currentEndsToday is false, streak continues from yesterday", () => {
    const result = calculateStreaks(
      [
        day("2024-01-01", 1, 1, 0, 0),
        day("2024-01-02", 1, 1, 0, 0),
        day("2024-01-03", 0, 0, 0, 0), // today = rest day
      ],
      { todayKey: "2024-01-03" },
    );
    expect(result.currentEndsToday).toBe(false);
    expect(result.current).toBe(2); // yesterday + day before
  });

  it("today has missed dose: returns current=0 immediately", () => {
    const result = calculateStreaks(
      [
        day("2024-01-01", 1, 1, 0, 0),
        day("2024-01-02", 1, 1, 0, 0),
        day("2024-01-03", 1, 0, 1, 0), // today: missed
      ],
      { todayKey: "2024-01-03", isTodayAdherentSoFar: false },
    );
    expect(result.current).toBe(0);
    expect(result.currentEndsToday).toBe(false);
    expect(result.longest).toBeGreaterThanOrEqual(2); // historical
  });

  it("longest streak is correctly computed with gap in middle", () => {
    const result = calculateStreaks([
      day("2024-01-01", 1, 1, 0, 0),
      day("2024-01-02", 1, 1, 0, 0),
      day("2024-01-03", 1, 1, 0, 0),
      day("2024-01-04", 1, 0, 1, 0), // break
      day("2024-01-05", 1, 1, 0, 0),
      day("2024-01-06", 1, 1, 0, 0),
    ]);
    expect(result.longest).toBe(3);
    expect(result.current).toBe(2);
  });

  it("handles unsorted input correctly by sorting before processing", () => {
    const result = calculateStreaks([
      day("2024-01-03", 1, 1, 0, 0),
      day("2024-01-01", 1, 1, 0, 0),
      day("2024-01-02", 1, 1, 0, 0),
    ]);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("isTodayAdherentSoFar overrides today data's missed field", () => {
    // today has missed=1 in data, but we override via isTodayAdherentSoFar=true
    const result = calculateStreaks(
      [
        day("2024-01-01", 1, 1, 0, 0),
        day("2024-01-02", 1, 0, 1, 0), // today: data says missed
      ],
      { todayKey: "2024-01-02", isTodayAdherentSoFar: true },
    );
    expect(result.current).toBe(2);
    expect(result.currentEndsToday).toBe(true);
  });
});
