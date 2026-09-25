/**
 * Phase 16 — pure report aggregation (§10.9). Reports reuse the canonical daily
 * `AdherenceDay[]` rows produced by `adherenceService.summary` and roll them into
 * daily / ISO-week / monthly periods here, so the table, trend and CSV all share
 * one deterministic aggregation path (identical numbers everywhere).
 */

import type { ReportGranularity } from "../enums";
import type { AdherenceDay, ReportRow, ReportTrendPoint } from "../types";
import { adherencePercent } from "./adherence";

export interface ReportAggregate {
  table: ReportRow[];
  trend: ReportTrendPoint[];
}

/** Group key for a local date (`YYYY-MM-DD`) under the requested granularity. */
export function periodKey(date: string, granularity: ReportGranularity): string {
  if (granularity === "monthly") return date.slice(0, 7); // YYYY-MM
  if (granularity === "weekly") {
    // ISO week key `YYYY-Www`: the Monday of the date's ISO week.
    const [y, m, d] = date.split("-").map(Number) as [number, number, number];
    const iso = new Date(Date.UTC(y, m - 1, d));
    const day = (iso.getUTCDay() + 6) % 7; // Monday=0 … Sunday=6
    const monday = new Date(Date.UTC(y, m - 1, d - day));
    return `${String(monday.getUTCFullYear()).padStart(4, "0")}-W${String(isoWeekOfDate(monday)).padStart(2, "0")}`;
  }
  return date; // daily → the day itself
}

function isoWeekOfDate(monday: Date): number {
  const target = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Roll canonical daily adherence rows into the requested granularity. Days without
 * a regimen produce no row; periods with all-zero "no data" still surface (their
 * `adherencePercent` is `null`). Sorted by period ascending.
 */
export function aggregateReport(days: readonly AdherenceDay[], granularity: ReportGranularity): ReportAggregate {
  const byPeriod = new Map<string, { scheduled: number; taken: number; missed: number; skipped: number }>();

  for (const day of days) {
    const key = periodKey(day.date, granularity);
    const acc = byPeriod.get(key) ?? { scheduled: 0, taken: 0, missed: 0, skipped: 0 };
    acc.scheduled += day.scheduled;
    acc.taken += day.taken;
    acc.missed += day.missed;
    acc.skipped += day.skipped;
    byPeriod.set(key, acc);
  }

  const periods = [...byPeriod.keys()].sort();
  const table: ReportRow[] = periods.map((period) => {
    const acc = byPeriod.get(period)!;
    return {
      period,
      scheduled: acc.scheduled,
      taken: acc.taken,
      missed: acc.missed,
      skipped: acc.skipped,
      adherencePercent: adherencePercent(acc),
    };
  });

  const trend: ReportTrendPoint[] = table.map((row) => ({
    label: row.period,
    adherence: row.adherencePercent,
    taken: row.taken,
    missed: row.missed,
    skipped: row.skipped,
  }));

  return { table, trend };
}

/** Period label → user-facing heading (daily `2026-05-01` → `May 1, 2026`). */
export function periodLabel(period: string, granularity: ReportGranularity): string {
  if (granularity === "monthly") return period;
  if (granularity === "weekly") return period;
  const [y, m, d] = period.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}