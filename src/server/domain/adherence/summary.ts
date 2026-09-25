/**
 * Phase 16 — Adherence summary aggregation service (plan §10.5, §9 types).
 *
 * Single source of truth producing `AdherenceSummaryDTO` used by:
 * - Adherence UI (/adherence)
 * - Dashboard (/dashboard)
 * - Reports (/reports)
 * - AI Insights (/insights)
 */

import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { doseEvents, users } from "@/server/db/schema";
import {
  calculateAdherencePercent,
  calculateTimeBucketStats,
} from "@/shared/calc/adherence";
import { calculateTrend } from "@/shared/calc/performance";
import { calculateStreaks } from "@/shared/calc/streaks";
import type { RangePreset } from "@/shared/enums";
import {
  combineDateAndTime,
  localDateKey,
  now,
  startOfLocalDay,
} from "@/shared/times";
import type {
  AdherenceDay,
  AdherenceSummaryDTO,
} from "@/shared/types";

export interface GetAdherenceSummaryOptions {
  from?: Date;
  to?: Date;
  rangePreset?: RangePreset;
  medicationId?: string;
  timeZone?: string;
}

export async function getAdherenceSummary(
  db: Db | DbTx,
  userId: string,
  options?: GetAdherenceSummaryOptions,
): Promise<AdherenceSummaryDTO> {
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

  // 2. Resolve date range bounds [from, to]
  const currentNow = now();
  const toDate = options?.to ?? currentNow;
  let fromDate = options?.from;

  if (!fromDate) {
    const daysBack =
      options?.rangePreset === "7d"
        ? 7
        : options?.rangePreset === "90d"
          ? 90
          : 30; // default 30d
    fromDate = new Date(toDate.getTime() - daysBack * 86400000);
  }

  // Ensure fromDate is start of local day and toDate is end of local day
  const fromKey = localDateKey(fromDate, timeZone);
  const toKey = localDateKey(toDate, timeZone);

  const startBound = startOfLocalDay(fromDate, timeZone);
  const endBound = combineDateAndTime(toKey, "23:59:59.999", timeZone);

  // 3. Query all dose events in the period
  const conditions = [
    eq(doseEvents.userId, userId),
    gte(doseEvents.scheduledFor, startBound),
    lte(doseEvents.scheduledFor, endBound),
  ];

  if (options?.medicationId) {
    conditions.push(eq(doseEvents.medicationId, options.medicationId));
  }

  const events = await db
    .select()
    .from(doseEvents)
    .where(and(...conditions))
    .orderBy(asc(doseEvents.scheduledFor));

  // 4. Calculate period totals
  let taken = 0;
  let missed = 0;
  let skipped = 0;
  let snoozed = 0;

  // Group events by day key
  const eventsByDay = new Map<string, typeof events>();

  for (const ev of events) {
    if (ev.status === "taken") taken += 1;
    else if (ev.status === "missed") missed += 1;
    else if (ev.status === "skipped") skipped += 1;

    if (ev.snoozeCount > 0) snoozed += 1;

    const dayKey = localDateKey(ev.scheduledFor, timeZone);
    const dayList = eventsByDay.get(dayKey) ?? [];
    dayList.push(ev);
    eventsByDay.set(dayKey, dayList);
  }

  const scheduled = taken + missed + skipped;
  const adherencePercent = calculateAdherencePercent(taken, scheduled);

  // 5. Generate daily series across the date range
  const days: AdherenceDay[] = [];
  const currentCursor = new Date(`${fromKey}T00:00:00Z`);
  const endCursor = new Date(`${toKey}T00:00:00Z`);

  while (currentCursor <= endCursor) {
    const dayKey = currentCursor.toISOString().slice(0, 10);
    const dayEvents = eventsByDay.get(dayKey) ?? [];

    let dayTaken = 0;
    let dayMissed = 0;
    let daySkipped = 0;
    let daySnoozed = 0;

    for (const ev of dayEvents) {
      if (ev.status === "taken") dayTaken += 1;
      else if (ev.status === "missed") dayMissed += 1;
      else if (ev.status === "skipped") daySkipped += 1;

      if (ev.snoozeCount > 0) daySnoozed += 1;
    }

    const dayScheduled = dayTaken + dayMissed + daySkipped;
    const dayAdherence = calculateAdherencePercent(dayTaken, dayScheduled);
    const streakDay = dayScheduled > 0 && dayMissed === 0 && daySkipped === 0;

    days.push({
      date: dayKey,
      scheduled: dayScheduled,
      taken: dayTaken,
      missed: dayMissed,
      skipped: daySkipped,
      snoozed: daySnoozed,
      adherencePercent: dayAdherence,
      streakDay,
    });

    currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
  }

  // 6. Calculate streaks
  const todayKey = localDateKey(currentNow, timeZone);
  const todayEvents = eventsByDay.get(todayKey) ?? [];
  const isTodayAdherentSoFar = todayEvents.every(
    (e) => e.status !== "missed" && e.status !== "skipped",
  );

  const streak = calculateStreaks(days, {
    todayKey,
    isTodayAdherentSoFar,
  });

  // 7. Calculate rolling trend
  const trend = calculateTrend(
    days.map((d) => ({ date: d.date, adherencePercent: d.adherencePercent })),
  );

  // 8. Time-of-day bucket statistics
  const byBucket = calculateTimeBucketStats(
    events.map((e) => ({ scheduledFor: e.scheduledFor, status: e.status })),
    timeZone,
  );

  return {
    from: startBound,
    to: endBound,
    scheduled,
    taken,
    missed,
    skipped,
    snoozed,
    adherencePercent,
    days,
    streak,
    trend,
    byBucket,
  };
}
