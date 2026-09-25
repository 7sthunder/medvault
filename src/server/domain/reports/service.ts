/**
 * Phase 20 — Reports domain service (plan §10.9, §11.11, §20).
 *
 * Single source of truth for:
 * - Aggregating period summaries across Daily, Weekly, and Monthly granularities.
 * - Sourcing canonical adherence metrics from `adherenceService`.
 * - Generating standard RFC 4180 CSV exports.
 */

import { format } from "date-fns";
import { eq } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { users } from "@/server/db/schema";
import {
  getAdherenceSummary,
  getMedicationPerformance,
} from "@/server/domain/adherence/service";
import { calculateAdherencePercent } from "@/shared/calc/adherence";
import {
  combineDateAndTime,
  localDateKey,
  now,
  startOfLocalDay,
} from "@/shared/times";
import type {
  ReportDTO,
  ReportRow,
  ReportSummaryStats,
  ReportTrendPoint,
} from "@/shared/types";
import type { ReportsInput } from "@/shared/validations/reports";

export interface GetReportDataOptions {
  timeZone?: string;
}

/**
 * Builds the canonical ReportDTO for the given date range and granularity.
 * Adherence numbers are 100% consistent with dashboard and adherence features
 * because they originate directly from `getAdherenceSummary`.
 */
export async function getReportData(
  db: Db | DbTx,
  userId: string,
  input?: Partial<ReportsInput>,
  options?: GetReportDataOptions,
): Promise<ReportDTO> {
  // 1. Resolve user timezone
  let timeZone = options?.timeZone;
  if (!timeZone) {
    const [u] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    timeZone = u?.timezone || "UTC";
  }

  // 2. Resolve input dates & boundaries
  const currentNow = now();
  const defaultTo = localDateKey(currentNow, timeZone);
  const defaultFrom = localDateKey(
    new Date(currentNow.getTime() - 30 * 86400000),
    timeZone,
  );

  const fromKey = input?.from ?? defaultFrom;
  const toKey = input?.to ?? defaultTo;
  const granularity = input?.granularity ?? "daily";
  const medicationId = input?.medicationId ?? null;

  const fromDate = startOfLocalDay(combineDateAndTime(fromKey, "00:00", timeZone), timeZone);
  const toDate = combineDateAndTime(toKey, "23:59", timeZone);

  // 3. Query canonical adherence summary
  const adherenceSummary = await getAdherenceSummary(db, userId, {
    from: fromDate,
    to: toDate,
    medicationId: medicationId ?? undefined,
    timeZone,
  });

  // 4. Query medication performance for missed-dose analysis
  const medPerformance = await getMedicationPerformance(db, userId, {
    from: fromDate,
    to: toDate,
    timeZone,
  });

  // 5. Aggregate days into table rows based on granularity
  let table: ReportRow[] = [];

  if (granularity === "daily") {
    table = adherenceSummary.days.map((day) => ({
      period: day.date,
      scheduled: day.scheduled,
      taken: day.taken,
      missed: day.missed,
      skipped: day.skipped,
      adherencePercent: day.adherencePercent,
    }));
  } else if (granularity === "weekly") {
    const weekBuckets = new Map<
      string,
      { scheduled: number; taken: number; missed: number; skipped: number }
    >();

    for (const day of adherenceSummary.days) {
      // Use UTC noon to cleanly derive ISO week key (RRRR-'W'II)
      const d = new Date(`${day.date}T12:00:00.000Z`);
      const weekKey = format(d, "RRRR-'W'II");

      const bucket = weekBuckets.get(weekKey) ?? {
        scheduled: 0,
        taken: 0,
        missed: 0,
        skipped: 0,
      };
      bucket.scheduled += day.scheduled;
      bucket.taken += day.taken;
      bucket.missed += day.missed;
      bucket.skipped += day.skipped;
      weekBuckets.set(weekKey, bucket);
    }

    table = Array.from(weekBuckets.entries()).map(([weekKey, stats]) => ({
      period: weekKey,
      scheduled: stats.scheduled,
      taken: stats.taken,
      missed: stats.missed,
      skipped: stats.skipped,
      adherencePercent: calculateAdherencePercent(stats.taken, stats.scheduled),
    }));
  } else if (granularity === "monthly") {
    const monthBuckets = new Map<
      string,
      { scheduled: number; taken: number; missed: number; skipped: number }
    >();

    for (const day of adherenceSummary.days) {
      const monthKey = day.date.slice(0, 7); // YYYY-MM

      const bucket = monthBuckets.get(monthKey) ?? {
        scheduled: 0,
        taken: 0,
        missed: 0,
        skipped: 0,
      };
      bucket.scheduled += day.scheduled;
      bucket.taken += day.taken;
      bucket.missed += day.missed;
      bucket.skipped += day.skipped;
      monthBuckets.set(monthKey, bucket);
    }

    table = Array.from(monthBuckets.entries()).map(([monthKey, stats]) => ({
      period: monthKey,
      scheduled: stats.scheduled,
      taken: stats.taken,
      missed: stats.missed,
      skipped: stats.skipped,
      adherencePercent: calculateAdherencePercent(stats.taken, stats.scheduled),
    }));
  }

  // 6. Build trend series
  const trend: ReportTrendPoint[] = table.map((row) => ({
    label: row.period,
    adherence: row.adherencePercent,
    taken: row.taken,
    missed: row.missed,
    skipped: row.skipped,
  }));

  // 7. Extract top-level summary stats directly from canonical summary
  const summary: ReportSummaryStats = {
    scheduled: adherenceSummary.scheduled,
    taken: adherenceSummary.taken,
    missed: adherenceSummary.missed,
    skipped: adherenceSummary.skipped,
    adherencePercent: adherenceSummary.adherencePercent,
  };

  // 8. Missed dose analysis
  let byMedication = medPerformance.map((med) => ({
    medicationId: med.medicationId,
    name: med.name,
    color: med.color,
    missed: med.missed,
    scheduled: med.scheduled,
    adherencePercent: med.adherencePercent,
  }));

  if (medicationId) {
    byMedication = byMedication.filter((m) => m.medicationId === medicationId);
  }
  byMedication.sort((a, b) => b.missed - a.missed || a.name.localeCompare(b.name));

  return {
    granularity,
    from: fromDate,
    to: toDate,
    medicationId,
    table,
    trend,
    summary,
    missedAnalysis: {
      byBucket: adherenceSummary.byBucket,
      byMedication,
    },
  };
}

/**
 * Escapes CSV values according to RFC 4180 rules.
 */
function escapeCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Generates deterministic RFC 4180 standard CSV content from a ReportDTO.
 * Header: `Period,Scheduled,Taken,Missed,Skipped,Adherence Rate`
 */
export function generateReportCsv(report: ReportDTO): string {
  const header = "Period,Scheduled,Taken,Missed,Skipped,Adherence Rate";
  const rows = report.table.map((row) => {
    const adherence =
      row.adherencePercent !== null ? `${row.adherencePercent}%` : "N/A";
    return [
      escapeCsv(row.period),
      row.scheduled,
      row.taken,
      row.missed,
      row.skipped,
      escapeCsv(adherence),
    ].join(",");
  });

  return [header, ...rows].join("\r\n") + "\r\n";
}
