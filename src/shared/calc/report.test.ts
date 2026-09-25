import { describe, expect, it } from "vitest";

import type { AdherenceDay } from "@/shared/types";
import { aggregateReport, periodKey, periodLabel } from "./report";

const day = (date: string, overrides: Partial<AdherenceDay> = {}): AdherenceDay => ({
  date,
  scheduled: 0,
  taken: 0,
  missed: 0,
  skipped: 0,
  snoozed: 0,
  adherencePercent: null,
  streakDay: false,
  ...overrides,
});

describe("report aggregation (§10.9)", () => {
  it("daily granularity keeps one row per date with summed counts", () => {
    const days = [
      day("2026-05-01", { scheduled: 2, taken: 2, missed: 0, skipped: 0, adherencePercent: 100 }),
      day("2026-05-02", { scheduled: 2, taken: 1, missed: 1, skipped: 0, adherencePercent: 50 }),
    ];
    const { table } = aggregateReport(days, "daily");
    expect(table).toHaveLength(2);
    expect(table[0]!.period).toBe("2026-05-01");
    expect(table[0]!.adherencePercent).toBe(100);
    expect(table[1]!.missed).toBe(1);
    expect(table[1]!.adherencePercent).toBe(50);
  });

  it("weekly granularity rolls days into ISO week keys (Monday-anchored)", () => {
    const days = [
      // Sun May 3 2026 → ISO week 2026-W18 (Monday Apr 27) …
      day("2026-05-03", { scheduled: 1, taken: 1, missed: 0, skipped: 0, adherencePercent: 100 }),
      // … Mon May 4 2026 starts 2026-W19; Mon May 11 2026 starts W20.
      day("2026-05-04", { scheduled: 1, taken: 0, missed: 1, skipped: 0, adherencePercent: 0 }),
      day("2026-05-11", { scheduled: 1, taken: 1, missed: 0, skipped: 0, adherencePercent: 100 }),
    ];
    const { table } = aggregateReport(days, "weekly");
    expect(table.map((r) => r.period)).toEqual(["2026-W18", "2026-W19", "2026-W20"]);
    expect(table[1]!.scheduled).toBe(1);
    expect(table[1]!.taken).toBe(0);
    expect(table[1]!.missed).toBe(1);
    expect(table[1]!.adherencePercent).toBe(0);
    expect(table[2]!.scheduled).toBe(1);
  });

  it("monthly granularity rolls days into YYYY-MM periods", () => {
    const days = [
      day("2026-05-31", { scheduled: 2, taken: 2, missed: 0, skipped: 0, adherencePercent: 100 }),
      day("2026-06-01", { scheduled: 3, taken: 2, missed: 1, skipped: 0, adherencePercent: 66.7 }),
    ];
    const { table } = aggregateReport(days, "monthly");
    expect(table.map((r) => r.period)).toEqual(["2026-05", "2026-06"]);
    expect(table[0]!.scheduled).toBe(2);
    expect(table[1]!.scheduled).toBe(3);
    expect(table[1]!.adherencePercent).toBeCloseTo(66.7, 1);
  });

  it("omits no-data days (zero scheduled) from the table", () => {
    const days = [day("2026-05-01", { scheduled: 2, taken: 2, missed: 0, skipped: 0, adherencePercent: 100 })];
    const { table } = aggregateReport(days, "daily");
    expect(table).toHaveLength(1);
    expect(table[0]!.period).toBe("2026-05-01");
  });

  it("produces a trend series aligned with the table", () => {
    const days = [day("2026-05-01", { scheduled: 2, taken: 1, missed: 1, skipped: 0, adherencePercent: 50 })];
    const { table, trend } = aggregateReport(days, "daily");
    expect(trend).toHaveLength(1);
    expect(trend[0]!.label).toBe(table[0]!.period);
    expect(trend[0]!.adherence).toBe(50);
    expect(trend[0]!.taken).toBe(1);
    expect(trend[0]!.missed).toBe(1);
  });
});

describe("report period keys + labels", () => {
  it("periodKey keeps daily dates and slices months", () => {
    expect(periodKey("2026-05-01", "daily")).toBe("2026-05-01");
    expect(periodKey("2026-05-31", "monthly")).toBe("2026-05");
  });

  it("periodLabel renders daily dates as a short heading", () => {
    expect(periodLabel("2026-05-01", "daily")).toContain("May");
    expect(periodLabel("2026-05", "monthly")).toBe("2026-05");
  });
});