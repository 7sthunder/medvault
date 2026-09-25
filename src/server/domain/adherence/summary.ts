/**
 * Phase 13 — `AdherenceSummaryDTO` builder (§10.5). Every UI surface that shows
 * adherence numbers (dashboard, adherence page, reports, insights) calls through this one
 * function so identical figures are guaranteed. Canonical flow:
 * reconcile → recompute materialized rows from events → build the DTO.
 */

import { and, eq, gte, inArray, lt } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { doseEvents } from "@/server/db/schema";
import { reconcileUser } from "@/server/domain/doseEvents/reconcile";
import { addLocalDays, combineDateAndTime, localDateKey, now } from "@/shared/times";
import { REPORT_MAX_SPAN_DAYS } from "@/shared/constants";
import { adherencePercent, bucketStats, computeTrend, sumCounts } from "@/shared/calc/adherence";
import { computeStreaks } from "@/shared/calc/streaks";
import type { AdherenceDay, AdherenceSummaryDTO } from "@/shared/types";

import { recomputeRange } from "./materialize";

export interface SummaryScope {
  userId: string;
  timeZone: string;
  from: Date;
  to: Date;
}

const RESOLVED = ["taken", "missed", "skipped"] as const;

export async function buildSummary(db: DbClient, scope: SummaryScope): Promise<AdherenceSummaryDTO> {
  const { userId, timeZone } = scope;
  const at = now();

  // Canonical read path: reconcile before any read so statuses are instant-correct.
  await reconcileUser(db, userId, { now: at });

  const fromKey = localDateKey(scope.from, timeZone);
  const toKey = localDateKey(scope.to, timeZone);
  const recDays = await recomputeRange(db, { userId, fromKey, toKey, timeZone, now: at });
  const byDay = new Map(recDays.map((d) => [d.date, d]));

  // Full contiguous calendar window — days without regimen become "no data" gaps.
  const days: AdherenceDay[] = [];
  let cursor = combineDateAndTime(fromKey, "00:00", timeZone);
  let guard = 0;
  while (localDateKey(cursor, timeZone) <= toKey && guard < REPORT_MAX_SPAN_DAYS) {
    const key = localDateKey(cursor, timeZone);
    const r = byDay.get(key);
    days.push({
      date: key,
      scheduled: r?.scheduled ?? 0,
      taken: r?.taken ?? 0,
      missed: r?.missed ?? 0,
      skipped: r?.skipped ?? 0,
      snoozed: r?.snoozed ?? 0,
      adherencePercent: r?.adherencePercent ?? null,
      streakDay: r?.streakDay ?? false,
    });
    cursor = addLocalDays(cursor, 1, timeZone);
    guard += 1;
  }

  const totals = sumCounts(days);
  const streak = computeStreaks(recDays, localDateKey(at, timeZone));
  const trend = computeTrend(days, localDateKey(at, timeZone));
  const byBucket = await bucketStatsFor(db, userId, timeZone, fromKey, toKey);

  return {
    from: scope.from,
    to: scope.to,
    scheduled: totals.scheduled,
    taken: totals.taken,
    missed: totals.missed,
    skipped: totals.skipped,
    snoozed: totals.snoozed,
    adherencePercent: adherencePercent(totals),
    days,
    streak,
    trend,
    byBucket,
  };
}

async function bucketStatsFor(db: DbClient, userId: string, timeZone: string, fromKey: string, toKey: string) {
  const start = combineDateAndTime(fromKey, "00:00", timeZone);
  const end = addLocalDays(combineDateAndTime(toKey, "00:00", timeZone), 1, timeZone);
  const rows = await db
    .select({
      scheduledFor: doseEvents.scheduledFor,
      status: doseEvents.status,
      snoozeCount: doseEvents.snoozeCount,
    })
    .from(doseEvents)
    .where(
      and(
        eq(doseEvents.userId, userId),
        gte(doseEvents.scheduledFor, start),
        lt(doseEvents.scheduledFor, end),
        inArray(doseEvents.status, RESOLVED),
      ),
    );
  return bucketStats(
    rows.map((r) => ({ scheduledFor: r.scheduledFor, status: r.status, snoozeCount: r.snoozeCount ?? 0 })),
    timeZone,
  );
}