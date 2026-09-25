import { describe, expect, it } from "vitest";

import {
  formatCompactNumber,
  formatCount,
  formatDateKey,
  formatDateRange,
  formatDayHeading,
  formatDurationLabel,
  formatHhmm,
  formatInstant,
  formatPercent,
  plural,
  shiftDateKey,
} from "@/lib/format";

describe("lib/format — dates & times", () => {
  it("formats date keys in the long and short forms", () => {
    expect(formatDateKey("2026-05-20")).toBe("May 20, 2026");
    expect(formatDateKey("2026-05-20", "short")).toBe("May 20");
    expect(formatDateKey("2025-12-01")).toBe("Dec 1, 2025");
  });

  it("formats a full day heading", () => {
    expect(formatDayHeading("2026-05-20")).toBe("Wed, May 20");
  });

  it("formats HH:mm in 12h and 24h styles", () => {
    expect(formatHhmm("08:00")).toBe("8:00 AM");
    expect(formatHhmm("20:30")).toBe("8:30 PM");
    expect(formatHhmm("00:00")).toBe("12:00 AM");
    expect(formatHhmm("08:00", { hour12: false })).toBe("08:00");
  });

  it("formats an instant as a user-timezone wall-clock time", () => {
    expect(formatInstant("2026-05-20T08:00:00.000Z", "UTC")).toBe("8:00 AM");
    expect(formatInstant("2026-05-20T06:30:00.000Z", "Asia/Kolkata")).toBe("12:00 PM");
    expect(formatInstant("2026-05-20T08:00:00.000Z", "America/New_York")).toBe("4:00 AM");
  });
});

describe("lib/format — schedule day-shift (phase 14)", () => {
  it("shifts date keys by whole days across month and year boundaries", () => {
    expect(shiftDateKey("2026-05-20", 1)).toBe("2026-05-21");
    expect(shiftDateKey("2026-05-20", -1)).toBe("2026-05-19");
    expect(shiftDateKey("2026-05-01", -1)).toBe("2026-04-30");
    expect(shiftDateKey("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("lib/format — numbers, percentages, plurals", () => {
  it("formats percentages rounded and stable", () => {
    expect(formatPercent(0.905)).toBe("90.5%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(0.333333)).toBe("33.3%");
    expect(formatPercent(0.5, 0)).toBe("50%");
  });

  it("groups thousands and compacts large numbers", () => {
    expect(formatCount(1240)).toBe("1,240");
    expect(formatCount(0)).toBe("0");
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(12400)).toBe("12.4k");
    expect(formatCompactNumber(1_340_000)).toBe("1.3M");
  });

  it("pluralises with an optional explicit plural", () => {
    expect(plural(1, "dose")).toBe("1 dose");
    expect(plural(3, "dose")).toBe("3 doses");
    expect(plural(2, "day")).toBe("2 days");
    expect(plural(5, "person", "people")).toBe("5 people");
  });
});

describe("lib/format — ranges & durations", () => {
  it("renders an inclusive range, compact within one year", () => {
    expect(formatDateRange("2026-05-01", "2026-05-10")).toBe("May 1 – May 10, 2026");
    expect(formatDateRange("2025-12-20", "2026-01-05")).toBe("Dec 20, 2025 – Jan 5, 2026");
  });

  it("renders duration labels", () => {
    expect(formatDurationLabel(1)).toBe("1 day");
    expect(formatDurationLabel(7)).toBe("7 days");
  });
});