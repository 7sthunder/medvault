/**
 * Phase 13 — pure adherence formulas (§10.5).
 *
 * Single source of truth for percentages, per-day totals, trend curves and time-of-day
 * buckets. `server/domain/adherence/*` turns `dose_events` rows into the inputs here,
 * so dashboard, adherence page, reports and insights all see identical numbers.
 */

import { TZDate } from "@date-fns/tz";

import { TIME_BUCKETS } from "../enums";
import type { DoseEventStatus, TimeBucket } from "../enums";
import { bucketOf } from "../times";
import type { TimeBucketStats, TrendDTO, TrendDay, TrendDirection } from "../types";

/* ── Day-level counts ────────────────────────────────────────────────────── */

export interface DayCounts {
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  snoozed: number;
}

export const EMPTY_DAY_COUNTS: DayCounts = { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 };

/** §10.5 — round to 1 dp (`Math.round(x*10)/10`). */
export function round1dp(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * §10.5 — adherence% = taken / (taken + missed + skipped) × 100, 1 dp.
 * `null` when the period has no required doses (UI shows "No data").
 */
export function adherencePercent(counts: Pick<DayCounts, "taken" | "missed" | "skipped">): number | null {
  const attended = counts.taken + counts.missed + counts.skipped;
  if (attended <= 0) return null;
  return round1dp((counts.taken / attended) * 100);
}

export function addCounts(a: DayCounts, b: DayCounts): DayCounts {
  return {
    scheduled: a.scheduled + b.scheduled,
    taken: a.taken + b.taken,
    missed: a.missed + b.missed,
    skipped: a.skipped + b.skipped,
    snoozed: a.snoozed + b.snoozed,
  };
}

export function sumCounts(rows: readonly Pick<DayCounts, keyof DayCounts>[]): DayCounts {
  return rows.reduce<DayCounts>((acc, row) => addCounts(acc, row), { ...EMPTY_DAY_COUNTS });
}

/* ── Time-of-day buckets (§10.5) ─────────────────────────────────────────── */

/** Local hour of an instant in `timeZone` (bucket edges are local to the user). */
export function hourOfLocal(instant: Date, timeZone: string): number {
  return new TZDate(instant, timeZone).getHours();
}

export function bucketOfInstant(instant: Date, timeZone: string): TimeBucket {
  return bucketOf(hourOfLocal(instant, timeZone));
}

/** Input events should already be filtered to resolved statuses (taken/missed/skipped). */
export function bucketStats(
  events: readonly { scheduledFor: Date; status: DoseEventStatus; snoozeCount: number }[],
  timeZone: string,
): TimeBucketStats[] {
  return TIME_BUCKETS.map((bucket) => {
    const inBucket = events.filter((e) => bucketOfInstant(e.scheduledFor, timeZone) === bucket);
    const taken = inBucket.filter((e) => e.status === "taken").length;
    const missed = inBucket.filter((e) => e.status === "missed").length;
    const skipped = inBucket.filter((e) => e.status === "skipped").length;
    return {
      bucket,
      scheduled: taken + missed + skipped,
      taken,
      missed,
      rate: adherencePercent({ taken, missed, skipped }),
    };
  });
}

/* ── Trends (§10.5) ──────────────────────────────────────────────────────── */

function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return round1dp(present.reduce((a, b) => a + b, 0) / present.length);
}

/**
 * Build the full trend block: per-day series, rolling 7-day average curve aligned to
 * day end, last-7 vs prior-7 direction. Defensive: missing data days never distort.
 */
export function computeTrend(days: readonly TrendDay[], todayKey: string): TrendDTO {
  const daily: TrendDay[] = days.map((d) => ({ date: d.date, adherencePercent: d.adherencePercent }));

  const rolling7: TrendDTO["rolling7"] = days.map((d, i) => {
    const window = days.slice(Math.max(0, i - 6), i + 1).map((w) => w.adherencePercent);
    return { date: d.date, value: average(window) };
  });

  const todayIdx = days.findIndex((d) => d.date === todayKey);

  const spanAvg = (endIdx: number): number | null => {
    if (endIdx < 0) return null;
    const window: (number | null)[] = [];
    for (let i = endIdx; i >= 0 && endIdx - i < 7; i -= 1) window.unshift(days[i]!.adherencePercent);
    return average(window);
  };

  const current7 = todayIdx >= 0 ? spanAvg(todayIdx) : null;
  const prior7 = todayIdx >= 0 ? spanAvg(todayIdx - 7) : null;

  let direction: TrendDirection = "stable";
  if (current7 !== null && prior7 !== null) {
    if (current7 > prior7 + 0.05) direction = "improving";
    else if (prior7 > current7 + 0.05) direction = "declining";
  }

  return { daily, rolling7, direction, current7, prior7 };
}