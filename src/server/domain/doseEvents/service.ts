/**
 * Phase 12 — Dose event generation and voiding service (plan §10.2).
 *
 * Implements:
 * - `ensureDoseEvents`: Idempotent expansion and insertion of dose events across a 14-day horizon.
 * - `voidFutureDoseEvents`: Voids future unresolved events on schedule change, pause, or archive.
 * - `catchUpDoseEvents`: On-demand catch-up for schedule/dashboard reads.
 */

import { and, eq, gt, inArray, isNull, notInArray } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import {
  doseEvents,
  medications,
  medicationSchedules,
  userPreferences,
  users,
} from "@/server/db/schema";
import { expandSchedule } from "@/shared/calc/schedule";
import { HORIZON_DAYS, MISSED_AFTER_DEFAULT } from "@/shared/constants";
import { addLocalDays, now, startOfLocalDay } from "@/shared/times";

export interface EnsureDoseEventsOptions {
  userId: string;
  medicationIds?: string[];
  from?: Date;
  to?: Date;
  timeZone?: string;
}

export interface EnsureDoseEventsResult {
  generatedCount: number;
  horizonFrom: Date;
  horizonTo: Date;
}

export interface VoidFutureDoseEventsOptions {
  userId: string;
  medicationId: string;
  from?: Date;
  /**
   * If provided, only events whose scheduleId is NOT in this list are voided.
   * If omitted, all future unresolved events for the medication are voided.
   */
  validScheduleIds?: string[];
}

export interface VoidResult {
  canceledCount: number;
}

/**
 * Idempotently ensures dose events exist across the horizon for active medications.
 * Uses onConflictDoNothing on (medicationId, scheduledFor).
 */
export async function ensureDoseEvents(
  db: Db | DbTx,
  options: EnsureDoseEventsOptions,
): Promise<EnsureDoseEventsResult> {
  const { userId, medicationIds } = options;

  // 1. Resolve user timezone and reminder settings
  let timeZone = options.timeZone;
  let missedAfterMinutes = MISSED_AFTER_DEFAULT;

  if (!timeZone) {
    const userRow = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    timeZone = userRow[0]?.timezone || "UTC";
  }

  const prefRow = await db
    .select({ missedAfterMinutes: userPreferences.missedAfterMinutes })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefRow[0]?.missedAfterMinutes) {
    missedAfterMinutes = prefRow[0].missedAfterMinutes;
  }

  // 2. Define the horizon: from today (local) -> today + HORIZON_DAYS (local)
  const currentNow = now();
  const horizonFrom = options.from ?? startOfLocalDay(currentNow, timeZone);
  const horizonTo = options.to ?? addLocalDays(horizonFrom, HORIZON_DAYS, timeZone);

  // 3. Query active, non-archived medications
  const medConditions = [
    eq(medications.userId, userId),
    eq(medications.status, "active"),
    isNull(medications.archivedAt),
  ];

  if (medicationIds && medicationIds.length > 0) {
    medConditions.push(inArray(medications.id, medicationIds));
  }

  const activeMeds = await db
    .select()
    .from(medications)
    .where(and(...medConditions));

  if (activeMeds.length === 0) {
    return { generatedCount: 0, horizonFrom, horizonTo };
  }

  // 4. Query enabled schedule slots for these medications
  const targetMedIds = activeMeds.map((m) => m.id);
  const slotRows = await db
    .select()
    .from(medicationSchedules)
    .where(
      and(
        inArray(medicationSchedules.medicationId, targetMedIds),
        eq(medicationSchedules.enabled, true),
      ),
    );

  const slotsByMed = new Map<string, typeof slotRows>();
  for (const slot of slotRows) {
    const list = slotsByMed.get(slot.medicationId) ?? [];
    list.push(slot);
    slotsByMed.set(slot.medicationId, list);
  }

  // 5. Expand planned events across all target medications
  const inserts: (typeof doseEvents.$inferInsert)[] = [];

  for (const med of activeMeds) {
    const medSlots = slotsByMed.get(med.id) ?? [];
    const planned = expandSchedule(
      {
        id: med.id,
        startDate: med.startDate,
        endDate: med.endDate,
        status: med.status,
      },
      medSlots,
      {
        from: horizonFrom,
        to: horizonTo,
        timeZone,
      },
    );

    for (const p of planned) {
      const scheduledMs = p.scheduledFor.getTime();
      const missedDeadline = new Date(scheduledMs + missedAfterMinutes * 60 * 1000);

      inserts.push({
        id: uuidv7(),
        userId,
        medicationId: p.medicationId,
        scheduleId: p.scheduleId,
        scheduledFor: p.scheduledFor,
        status: "upcoming",
        missedDeadline,
        snoozeCount: 0,
        statusUpdatedAt: currentNow,
        isDemo: false,
        source: "generated",
      });
    }
  }

  if (inserts.length === 0) {
    return { generatedCount: 0, horizonFrom, horizonTo };
  }

  // 6. Idempotent bulk insertion: ignore duplicates on (medicationId, scheduledFor)
  await db
    .insert(doseEvents)
    .values(inserts)
    .onConflictDoNothing({
      target: [doseEvents.medicationId, doseEvents.scheduledFor],
    });

  return {
    generatedCount: inserts.length,
    horizonFrom,
    horizonTo,
  };
}

/**
 * Voids future unresolved dose events ('upcoming', 'due', 'snoozed') where scheduledFor > from.
 * Preserves past history intact.
 */
export async function voidFutureDoseEvents(
  db: Db | DbTx,
  options: VoidFutureDoseEventsOptions,
): Promise<VoidResult> {
  const { userId, medicationId, validScheduleIds } = options;
  const cutoff = options.from ?? now();

  const conditions = [
    eq(doseEvents.userId, userId),
    eq(doseEvents.medicationId, medicationId),
    gt(doseEvents.scheduledFor, cutoff),
    inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
  ];

  // If validScheduleIds provided, only void events NOT associated with a valid slot
  if (validScheduleIds !== undefined) {
    if (validScheduleIds.length > 0) {
      conditions.push(notInArray(doseEvents.scheduleId, validScheduleIds));
    }
    // If validScheduleIds is empty array, all future slots are invalid -> void all
  }

  const updatedRows = await db
    .update(doseEvents)
    .set({
      status: "canceled",
      statusUpdatedAt: now(),
    })
    .where(and(...conditions))
    .returning({ id: doseEvents.id });

  return { canceledCount: updatedRows.length };
}

/**
 * On-demand catch-up: ensures events across the horizon for all active user medications.
 */
export async function catchUpDoseEvents(
  db: Db | DbTx,
  userId: string,
  timeZone?: string,
): Promise<EnsureDoseEventsResult> {
  return ensureDoseEvents(db, { userId, timeZone });
}
