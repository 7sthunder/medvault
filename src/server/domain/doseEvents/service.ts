import { and, eq, gte, inArray, isNull } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { doseEvents, medications as schemaMedications, medicationSchedules as schemaSchedules } from "@/server/db/schema";
import { HORIZON_DAYS } from "@/shared/constants";
import { DOSE_EVENT_STATUSES } from "@/shared/enums";
import type { DoseEventStatus } from "@/shared/enums";
import { addLocalDays, combineDateAndTime, localDateKey, now } from "@/shared/times";
import { expandSchedule } from "@/shared/calc/schedule";

/**
 * Phase 12 — dose-event generation engine (§10.2).
 *
 * `ensureDoseEvents` expands a medication's schedule onto `dose_events` rows with an
 * idempotent `(medicationId, scheduledFor)` upsert; `voidFutureEvents` cancels unresolved
 * future rows (pause / schedule change / archive); `extendHorizon` + `catchUp` are the
 * on-demand / job entry points. Generation is deterministic (§10.2) and timezone-threaded
 * so every read path sees the same instants.
 */
export interface EnsureDoseEventsInput {
  userId: string;
  medicationId: string;
  timeZone: string;
  /** Local `YYYY-MM-DD`; default = medication.startDate. */
  from?: string;
  /** Local `YYYY-MM-DD`; default = today + HORIZON_DAYS. */
  to?: string;
}

/** Local-day horizon end (`today + HORIZON_DAYS`) used when `to` is omitted. */
function horizonEndKey(timeZone: string, at: Date = now()): string {
  return localDateKey(addLocalDays(at, HORIZON_DAYS, timeZone), timeZone);
}

/** Local `HH:mm` + `YYYY-MM-DD` → instant in `timeZone`. */
function localToInstant(dateKey: string, timeZone: string): Date {
  return combineDateAndTime(dateKey, "00:00", timeZone);
}

/**
 * Generate + upsert dose events for one medication. Idempotent: running twice for the
 * same window produces no duplicate rows (`dose_events_med_scheduled_uq`).
 * Skipped (paused / archived) medications return `{ ensured: 0, skipped: true }`.
 */
export async function ensureDoseEvents(
  db: Db | DbTx,
  input: EnsureDoseEventsInput,
): Promise<{ ensured: number; skipped: boolean }> {
  const { userId, medicationId, timeZone } = input;

  const [med] = await db
    .select()
    .from(schemaMedications)
    .where(and(eq(schemaMedications.id, medicationId), eq(schemaMedications.userId, userId)));
  if (!med) throw new Error(`ensureDoseEvents: unknown medication ${medicationId} for user ${userId}`);
  if (med.archivedAt || med.status !== "active") return { ensured: 0, skipped: true };

  const slots = await db
    .select()
    .from(schemaSchedules)
    .where(and(eq(schemaSchedules.medicationId, medicationId), eq(schemaSchedules.enabled, true)))
    .orderBy(schemaSchedules.timeOfDay);

  // §10.2 clamping: window ⊆ [startDate, endDate] and `to` ≤ today+HORIZON.
  const from = (input.from ?? med.startDate) > med.startDate ? (input.from ?? med.startDate) : med.startDate;
  let to = input.to ?? horizonEndKey(timeZone);
  if (med.endDate && to > med.endDate) to = med.endDate;
  if (from > to) return { ensured: 0, skipped: false };

  const doses = expandSchedule(med, slots, from, to, timeZone);
  if (doses.length === 0) return { ensured: 0, skipped: false };

  const rows = doses.map(({ scheduledFor, scheduleId }) => ({
    id: uuidv7(),
    userId,
    medicationId,
    scheduleId,
    scheduledFor,
    status: "upcoming" as DoseEventStatus,
    statusUpdatedAt: scheduledFor,
  }));

  const inserted = await db
    .insert(doseEvents)
    .values(rows)
    .onConflictDoNothing({ target: [doseEvents.medicationId, doseEvents.scheduledFor] })
    .returning({ id: doseEvents.id });

  return { ensured: inserted.length, skipped: false };
}

/**
 * Void (cancel) future unresolved events for a medication from `fromLocalDay` on.
 * Only rows that have not been resolved are touched (`upcoming`/`due`/`snoozed`) — taken /
 * skipped / missed history is preserved. Returns the number of voided rows.
 */
export async function voidFutureEvents(
  db: Db | DbTx,
  userId: string,
  medicationId: string,
  fromLocalDay: string,
  timeZone: string,
): Promise<number> {
  const fromInstant = localToInstant(fromLocalDay, timeZone);
  const unresolved = [DOSE_EVENT_STATUSES[0]!, DOSE_EVENT_STATUSES[1]!, DOSE_EVENT_STATUSES[2]!]; // upcoming, due, snoozed
  const rows = await db
    .update(doseEvents)
    .set({ status: "canceled", statusUpdatedAt: now() })
    .where(
      and(
        eq(doseEvents.userId, userId),
        eq(doseEvents.medicationId, medicationId),
        gte(doseEvents.scheduledFor, fromInstant),
        inArray(doseEvents.status, unresolved),
      ),
    )
    .returning({ id: doseEvents.id });
  return rows.length;
}

/**
 * Extend the generation horizon for every active medication: fills any gap between each
 * med's `startDate` and `today + HORIZON_DAYS`. Deterministic + idempotent; called by the
 * catch-up path and the periodic job. Returns per-med ensured counts.
 */
export async function extendHorizon(
  db: Db | DbTx,
  userId: string,
  timeZone: string,
): Promise<{ medications: number; ensured: number }> {
  const meds = await db
    .select()
    .from(schemaMedications)
    .where(
      and(eq(schemaMedications.userId, userId), eq(schemaMedications.status, "active"), isNull(schemaMedications.archivedAt)),
    );
  let ensured = 0;
  for (const med of meds) {
    const res = await ensureDoseEvents(db, { userId, medicationId: med.id, timeZone });
    ensured += res.ensured;
  }
  return { medications: meds.length, ensured };
}

/**
 * On-demand catch-up entry point (schedule/dashboard reads + the job call this). Phase 12
 * = extendHorizon only; Phase 13 folds `reconcile.run` (missed detection) into it so reads
 * stay canonical without a clock dependency.
 */
export async function catchUp(db: Db | DbTx, userId: string, timeZone: string): Promise<{ medications: number; ensured: number }> {
  return extendHorizon(db, userId, timeZone);
}