/**
 * Phase 15 — medication list extras (§11.4/§10.5).
 *
 * `MedicationDTO.nextDoseAt` + `adherencePercent` are filled here in a single bulk pass
 * over `dose_events`, so the medications page and the dashboard reuse the *exact* same
 * numbers the schedule/adherence pages compute. `nextDoseAt` = soonest unresolved future
 * dose; `adherencePercent` = the shared §10.5 ratio over the last 30 days of doses.
 */

import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { doseEvents } from "@/server/db/schema";
import { DOSE_EVENT_STATUSES } from "@/shared/enums";
import type { DoseEventStatus, FrequencyLabel } from "@/shared/enums";
import { addLocalDays, startOfLocalDay, now } from "@/shared/times";
import { medicationPerformance } from "@/shared/calc/performance";

const UNRESOLVED = [DOSE_EVENT_STATUSES[0]!, DOSE_EVENT_STATUSES[1]!, DOSE_EVENT_STATUSES[2]!]; // upcoming, due, snoozed

export interface MedicationExtras {
  nextDoseAt: Date | null;
  adherencePercent: number | null;
}

type ExtraSource = {
  id: string;
  name: string;
  color: string;
  frequencyLabel: FrequencyLabel;
};

/**
 * Bulk-fill extras for a list of medications (one query each for upcoming + resolved
 * events). Callers merge the result back into their DTOs.
 */
export async function medicationExtras(
  db: Db | DbTx,
  userId: string,
  timeZone: string,
  meds: readonly ExtraSource[],
): Promise<Map<string, MedicationExtras>> {
  const extras = new Map<string, MedicationExtras>();
  if (meds.length === 0) return extras;

  const ids = meds.map((m) => m.id);
  const fromInstant = startOfLocalDay(now(), timeZone);

  const [upcoming, resolved] = await Promise.all([
    db
      .select({ medicationId: doseEvents.medicationId, scheduledFor: doseEvents.scheduledFor })
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.userId, userId),
          inArray(doseEvents.medicationId, ids),
          inArray(doseEvents.status, UNRESOLVED),
          gte(doseEvents.scheduledFor, fromInstant),
        ),
      )
      .orderBy(asc(doseEvents.scheduledFor)),
    db
      .select({
        medicationId: doseEvents.medicationId,
        status: doseEvents.status,
        scheduledFor: doseEvents.scheduledFor,
        takenAt: doseEvents.takenAt,
        snoozeCount: doseEvents.snoozeCount,
      })
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.userId, userId),
          inArray(doseEvents.medicationId, ids),
          gte(doseEvents.scheduledFor, addLocalDays(fromInstant, -29, timeZone)),
          lt(doseEvents.scheduledFor, addLocalDays(fromInstant, 1, timeZone)),
          inArray(doseEvents.status, ["taken", "missed", "skipped"] as DoseEventStatus[]),
        ),
      ),
  ]);

  const nextByMed = new Map<string, Date>();
  for (const row of upcoming) {
    if (!nextByMed.has(row.medicationId)) nextByMed.set(row.medicationId, row.scheduledFor);
  }

  const eventsByMed = new Map<string, { status: DoseEventStatus; scheduledFor: Date; takenAt: Date | null; snoozeCount: number }[]>();
  for (const row of resolved) {
    const bucket = eventsByMed.get(row.medicationId) ?? [];
    bucket!.push({ status: row.status as DoseEventStatus, scheduledFor: row.scheduledFor, takenAt: row.takenAt, snoozeCount: row.snoozeCount });
    eventsByMed.set(row.medicationId, bucket!);
  }

  const performance = medicationPerformance(
    meds.map((med) => ({
      id: med.id,
      name: med.name,
      color: med.color,
      frequencyLabel: med.frequencyLabel,
      events: eventsByMed.get(med.id) ?? [],
    })),
    timeZone,
  );
  const perfByMed = new Map(performance.map((p) => [p.medicationId, p] as const));

  for (const med of meds) {
    extras.set(med.id, {
      nextDoseAt: nextByMed.get(med.id) ?? null,
      adherencePercent: perfByMed.get(med.id)?.adherencePercent ?? null,
    });
  }

  return extras;
}