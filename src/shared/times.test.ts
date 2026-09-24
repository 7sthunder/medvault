import { describe, expect, it } from "vitest";

import { TIME_BUCKET_BOUNDS, VALUE_LIMITS } from "./constants";
import {
  bucketOf,
  combineDateAndTime,
  isSameLocalDay,
  localDateKey,
  now,
  parseHhMm,
  rangeByPreset,
  resetNowImpl,
  setNowImpl,
  startOfLocalDay,
} from "./times";

const TZ = "Asia/Kolkata"; // UTC+5:30 (no DST) — good fixed-offset probe
const TZ_DST = "America/New_York";

describe("shared/times — local calendar days", () => {
  it("formats a local date key with the given timezone offset", () => {
    const instant = new Date("2026-01-15T18:30:00.000Z");
    // 18:30 UTC = 00:00 next day in Kolkata (today would be 2026-01-16).
    expect(localDateKey(instant, TZ)).toBe("2026-01-16");
    expect(localDateKey(instant, "UTC")).toBe("2026-01-15");
    // New York is UTC-5 in January → still the 15th at 13:30.
    expect(localDateKey(instant, TZ_DST)).toBe("2026-01-15");
  });

  it("isSameLocalDay compares by the user's calendar", () => {
    const beforeMidnight = new Date("2026-03-09T18:00:00.000Z"); // 23:30 on the 9th in Kolkata
    const afterMidnight = new Date("2026-03-09T19:00:00.000Z"); // 00:30 on the 10th in Kolkata
    expect(isSameLocalDay(beforeMidnight, afterMidnight, "UTC")).toBe(true); // both still the 9th in UTC
    expect(isSameLocalDay(beforeMidnight, afterMidnight, TZ)).toBe(false); // crossed local midnight in IST
  });

  it("startOfLocalDay returns the midnight instant for that calendar day", () => {
    const d = new Date("2026-06-15T12:00:00.000Z");
    expect(localDateKey(startOfLocalDay(d, TZ), TZ)).toBe("2026-06-15");
    // 2026-06-15 00:00 IST (+05:30) = 2026-06-14T18:30:00Z as an absolute instant.
    expect(startOfLocalDay(d, TZ).getTime()).toBe(Date.UTC(2026, 5, 14, 18, 30, 0, 0));
  });
});

describe("shared/times — combineDateAndTime", () => {
  it("builds the correct absolute instant for a timezone (fixed offset)", () => {
    const at = combineDateAndTime("2026-01-15", "08:00", TZ);
    // 08:00 IST (+05:30) = 02:30 UTC.
    expect(at.getTime()).toBe(Date.UTC(2026, 0, 15, 2, 30, 0, 0));
    expect(localDateKey(at, TZ)).toBe("2026-01-15");
  });

  it("handles a DST timezone (EDT vs EST) using the offset of that date", () => {
    const summer = combineDateAndTime("2026-07-15", "08:00", TZ_DST); // EDT = UTC-4
    expect(summer.getTime()).toBe(Date.UTC(2026, 6, 15, 12, 0, 0, 0));
    const winter = combineDateAndTime("2026-01-15", "08:00", TZ_DST); // EST = UTC-5
    expect(winter.getTime()).toBe(Date.UTC(2026, 0, 15, 13, 0, 0, 0));
  });

  it("rejects malformed input", () => {
    expect(() => combineDateAndTime("2026/01/15", "08:00", TZ)).toThrow(/dateKey/);
    expect(() => combineDateAndTime("2026-01-15", "24:00", TZ)).toThrow(/hh:mm/);
  });
});

describe("shared/times — parseHhMm", () => {
  it("parses valid times and rejects invalid ones", () => {
    expect(parseHhMm("08:30")).toEqual({ hour: 8, minute: 30 });
    expect(parseHhMm("00:00")).toEqual({ hour: 0, minute: 0 });
    expect(parseHhMm("23:59")).toEqual({ hour: 23, minute: 59 });
    expect(parseHhMm("24:00")).toBeNull();
    expect(parseHhMm("12:60")).toBeNull();
    expect(parseHhMm("8:30")).toBeNull();
    expect(parseHhMm("not-a-time")).toBeNull();
  });
});

describe("shared/times — time-of-day buckets (§10.5)", () => {
  it.each([
    [0, "morning"],
    [11, "morning"],
    [12, "afternoon"],
    [16, "afternoon"],
    [17, "evening"],
    [20, "evening"],
    [21, "night"],
    [23, "night"],
  ] as const)("hour %i → %s", (hour, bucket) => {
    expect(bucketOf(hour)).toBe(bucket);
  });

  it("declares bucket bounds as half-open [start, end) covering 0–24", () => {
    const entries = Object.entries(TIME_BUCKET_BOUNDS);
    for (const [, { start, end }] of entries) {
      expect(start).toBeLessThan(end);
    }
    // continuity: end of one = start of next
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i]![1].start).toBe(entries[i - 1]![1].end);
    }
  });
});

describe("shared/times — rangeByPreset", () => {
  it("returns a full inclusive window ending today for 7/30/90d", () => {
    const nowDt = new Date("2026-05-20T12:00:00.000Z");
    for (const preset of ["7d", "30d", "90d"] as const) {
      const { from, to } = rangeByPreset(preset, { now: nowDt, timeZone: "UTC" });
      const toKey = localDateKey(to, "UTC");
      const fromKey = localDateKey(from, "UTC");
      expect(fromKey).toBe(preset === "7d" ? "2026-05-14" : preset === "30d" ? "2026-04-21" : "2026-02-20");
      expect(toKey).toBe("2026-05-20");
      expect(to.getTime()).toBeGreaterThan(from.getTime()); // end-of-day > start-of-day
    }
  });

  it("anchors from/to in a non-UTC timezone", () => {
    const nowDt = new Date("2026-05-20T18:30:00.000Z"); // 00:00 on the 21st in Kolkata
    const { from, to } = rangeByPreset("7d", { now: nowDt, timeZone: TZ });
    expect(localDateKey(to, TZ)).toBe("2026-05-21");
    expect(localDateKey(from, TZ)).toBe("2026-05-15");
  });

  it("supports an explicit custom range", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const to = new Date("2026-01-05T00:00:00.000Z");
    expect(rangeByPreset("custom", { from, to })).toEqual({ from, to });
    // Compile-time the overload requires from/to; the runtime guard is defensive.
    expect(() => rangeByPreset("custom", {} as { from: Date; to: Date })).toThrow(/requires explicit/);
  });
});

describe("shared/times — now() indirection (demo seam)", () => {
  it("defaults to the real clock", () => {
    resetNowImpl();
    const before = new Date();
    const seen = now();
    const after = new Date();
    expect(seen.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(seen.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("can be overridden and reset (Phase 25 demo clock)", () => {
    const fake = new Date("2030-01-01T00:00:00.000Z");
    setNowImpl(() => fake);
    expect(now()).toEqual(fake);
    resetNowImpl();
    expect(now().getFullYear()).toBeLessThan(2030);
  });
});

describe("shared/constants — bound sanity", () => {
  it("exposes sane reminder ranges", () => {
    expect(VALUE_LIMITS.missedAfterMinutes.min).toBeGreaterThan(0);
    expect(VALUE_LIMITS.snoozeMinutes.min).toBeGreaterThan(0);
    expect(VALUE_LIMITS.maxSnoozes.max).toBeGreaterThanOrEqual(3);
  });
});