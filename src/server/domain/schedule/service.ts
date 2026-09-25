/**
 * Phase 14 — schedule read service (§10.2/§11.7 read surface).
 *
 * `schedule.service` owns the "today's schedule" + dose-detail reads the `/schedule`
 * routes and the dashboard next-dose widget consume. Reads are canonical:
 * 1. reconcile pending events to their live status at `now` (deterministic misses),
 * 2. extend the generation horizon (deterministic idempotent upsert),
 * 3. then query the affected local-day window and map to `DoseEventDTO`.
 */

import { and, eq, gte, lt } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { doseActions, doseEvents, medications, userPreferences } from "@/server/db/schema";
import { MISSED_AFTER_DEFAULT } from "@/shared/constants";
import { addLocalDays, combineDateAndTime, now } from "@/shared/times";
import type { DoseDetailDTO, ScheduleDayDTO } from "@/shared/types";

import { catchUp } from "@/server/domain/doseEvents/service";
import { reconcileUser } from "@/server/domain/doseEvents/reconcile";
import {
  toDoseActionDTO,
  toDoseEventDTO,
  toMedicationLiteMap,
} from "@/server/domain/doseEvents/mapper";

async function missedAfterFor(db: Db | DbTx, userId: string): Promise<number> {
  const [prefs] = await db
    .select({ missedAfterMinutes: userPreferences.missedAfterMinutes })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return prefs?.missedAfterMinutes ?? MISSED_AFTER_DEFAULT;
}

/** Start-of-local-day instant for the window (upper bound derives as next local day). */
function startOfLocalDayInstant(localDay: string, timeZone: string): Date {
  return combineDateAndTime(localDay, "00:00", timeZone);
}

export const scheduleService = {
  /**
   * §11.7 `schedule.day(date)` — the whole day's dose feed. Reconciles + extends the
   * horizon first so stale-past days are canonical and today's future events exist.
   */
  async day(
    db: Db | DbTx,
    userId: string,
    timeZone: string,
    dateKey: string,
  ): Promise<ScheduleDayDTO> {
    const at = now();
    await reconcileUser(db, userId, { now: at });
    await catchUp(db, userId, timeZone);
    const missedAfter = await missedAfterFor(db, userId);

    const from = startOfLocalDayInstant(dateKey, timeZone);
    const to = addLocalDays(from, 1, timeZone);
    const [rows, medRows] = await Promise.all([
      db
        .select()
        .from(doseEvents)
        .where(
          and(
            eq(doseEvents.userId, userId),
            gte(doseEvents.scheduledFor, from),
            lt(doseEvents.scheduledFor, to),
          ),
        )
        .orderBy(doseEvents.scheduledFor),
      db.select().from(medications).where(eq(medications.userId, userId)),
    ]);
    const meds = toMedicationLiteMap(medRows);

    const events = rows
      .map((row) => {
        const med = meds.get(row.medicationId);
        return med ? toDoseEventDTO(row, med, { now: at, missedAfterMinutes: missedAfter }) : null;
      })
      .filter((dto): dto is NonNullable<typeof dto> => dto !== null);

    return { date: dateKey, events };
  },

  /**
   * §11.7 `dose.get` — one owned dose + its append-only action history (snooze/miss
   * timeline). Reconciles first so the returned status is the live one.
   */
  async get(
    db: Db | DbTx,
    userId: string,
    // Unused: every dose timestamp is stored absolute and returned as-is, so no local-time
    // conversion happens here. Kept in the signature so the service methods stay uniform.
    _timeZone: string,
    doseId: string,
  ): Promise<DoseDetailDTO | null> {
    const at = now();
    await reconcileUser(db, userId, { now: at });
    const missedAfter = await missedAfterFor(db, userId);

    const [event] = await db
      .select()
      .from(doseEvents)
      .where(and(eq(doseEvents.id, doseId), eq(doseEvents.userId, userId)))
      .limit(1);
    if (!event) return null;

    const [med] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, event.medicationId))
      .limit(1);
    if (!med) return null;

    const actions = await db
      .select()
      .from(doseActions)
      .where(eq(doseActions.doseEventId, doseId))
      .orderBy(doseActions.occurredAt);

    return {
      event: toDoseEventDTO(event, med, { now: at, missedAfterMinutes: missedAfter }),
      history: actions.map((a) =>
        toDoseActionDTO(a, med, {
          eventStatus: event.status,
          eventScheduledFor: event.scheduledFor,
        }),
      ),
    };
  },
};
