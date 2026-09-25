/**
 * Phase 16 — Adherence daily materialization service (plan §10.5, §8.7).
 *
 * Persists and updates materialized day rows in `adherence_daily` to speed up
 * historical queries and dashboard metrics.
 */

import { and, eq, gte, isNull, lte } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { adherenceDaily, doseEvents } from "@/server/db/schema";
import { calculateAdherencePercent } from "@/shared/calc/adherence";
import { combineDateAndTime } from "@/shared/times";

/**
 * Recomputes and materializes daily adherence for a specific calendar day.
 */
export async function recomputeDay(
  db: Db | DbTx,
  userId: string,
  dateKey: string,
  timeZone: string = "UTC",
  medicationId?: string,
): Promise<void> {
  const startOfDay = combineDateAndTime(dateKey, "00:00", timeZone);
  const endOfDay = combineDateAndTime(dateKey, "23:59:59.999", timeZone);

  const conditions = [
    eq(doseEvents.userId, userId),
    gte(doseEvents.scheduledFor, startOfDay),
    lte(doseEvents.scheduledFor, endOfDay),
  ];

  if (medicationId) {
    conditions.push(eq(doseEvents.medicationId, medicationId));
  }

  const events = await db
    .select()
    .from(doseEvents)
    .where(and(...conditions));

  let taken = 0;
  let missed = 0;
  let skipped = 0;
  let snoozed = 0;

  for (const ev of events) {
    if (ev.status === "taken") taken += 1;
    else if (ev.status === "missed") missed += 1;
    else if (ev.status === "skipped") skipped += 1;

    if (ev.snoozeCount > 0) snoozed += 1;
  }

  const scheduled = taken + missed + skipped;
  const adherencePercent = calculateAdherencePercent(taken, scheduled);
  const streakDay = scheduled > 0 && missed === 0 && skipped === 0;

  // Check if row already exists
  const existingConditions = [
    eq(adherenceDaily.userId, userId),
    eq(adherenceDaily.date, dateKey),
  ];
  if (medicationId) {
    existingConditions.push(eq(adherenceDaily.medicationId, medicationId));
  } else {
    existingConditions.push(isNull(adherenceDaily.medicationId));
  }

  const [existing] = await db
    .select({ id: adherenceDaily.id })
    .from(adherenceDaily)
    .where(and(...existingConditions))
    .limit(1);

  if (existing) {
    await db
      .update(adherenceDaily)
      .set({
        scheduled,
        taken,
        missed,
        skipped,
        snoozed,
        adherencePercent: adherencePercent !== null ? String(adherencePercent) : null,
        streakDay,
        updatedAt: new Date(),
      })
      .where(eq(adherenceDaily.id, existing.id));
  } else {
    await db.insert(adherenceDaily).values({
      id: uuidv7(),
      userId,
      date: dateKey,
      medicationId: medicationId ?? null,
      scheduled,
      taken,
      missed,
      skipped,
      snoozed,
      adherencePercent: adherencePercent !== null ? String(adherencePercent) : null,
      streakDay,
      updatedAt: new Date(),
    });
  }
}

/**
 * Recomputes all days in a date range [fromDateKey, toDateKey].
 */
export async function recomputeRange(
  db: Db | DbTx,
  userId: string,
  fromDateKey: string,
  toDateKey: string,
  timeZone: string = "UTC",
): Promise<void> {
  const current = new Date(`${fromDateKey}T00:00:00Z`);
  const end = new Date(`${toDateKey}T00:00:00Z`);

  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    await recomputeDay(db, userId, key, timeZone);
    current.setUTCDate(current.getUTCDate() + 1);
  }
}
