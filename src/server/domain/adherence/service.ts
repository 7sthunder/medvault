/**
 * Phase 13 — adherence domain service (§10.5). Facade over `summary` + `materialize` +
 * the pure per-med aggregators; the `adherence.*` tRPC router calls only these methods.
 */

import { and, eq, gte, inArray, lt } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { doseEvents, medications, medicationSchedules } from "@/server/db/schema";
import { reconcileUser } from "@/server/domain/doseEvents/reconcile";
import { frequencyLabelOf } from "@/server/domain/medications/mapper";
import { addLocalDays, combineDateAndTime, localDateKey, now } from "@/shared/times";
import { bucketStats } from "@/shared/calc/adherence";
import { medicationPerformance } from "@/shared/calc/performance";

import { buildSummary } from "./summary";
import { pruneAdherence } from "./materialize";
import type { AdherenceSummaryDTO, MedicationPerformanceDTO, TimeBucketStats } from "@/shared/types";

export interface AdherenceWindow {
  from: Date;
  to: Date;
}

/** Phase 17 (§10.10) — read-path switches. `readOnly` skips reconcile + re-materialize. */
export interface AdherenceReadOptions {
  /** Build the DTO from materialized `adherence_daily` rows only — performs no writes. */
  readOnly?: boolean;
}

const RESOLVED = ["taken", "missed", "skipped"] as const;

export const adherenceService = {
  /** One shape for every adherence surface (§10.5 note). Optional per-med scope. */
  async summary(
    db: DbClient,
    userId: string,
    timeZone: string,
    window: AdherenceWindow,
    medicationId?: string | null,
    options: AdherenceReadOptions = {},
  ): Promise<AdherenceSummaryDTO> {
    return buildSummary(db, {
      userId,
      timeZone,
      from: window.from,
      to: window.to,
      medicationId,
      readOnly: options.readOnly ?? false,
    });
  },

  /** Per-medication performance for the period (aggregates all owned meds). */
  async byMedication(
    db: DbClient,
    userId: string,
    timeZone: string,
    window: AdherenceWindow,
    options: AdherenceReadOptions = {},
  ): Promise<MedicationPerformanceDTO[]> {
    if (!options.readOnly) {
      await reconcileUser(db, userId, { now: now() });
    }

    const start = combineDateAndTime(localDateKey(window.from, timeZone), "00:00", timeZone);
    const end = addLocalDays(combineDateAndTime(localDateKey(window.to, timeZone), "00:00", timeZone), 1, timeZone);

    const [meds, slots, rows] = await Promise.all([
      db.select().from(medications).where(eq(medications.userId, userId)),
      db.select().from(medicationSchedules),
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
            gte(doseEvents.scheduledFor, start),
            lt(doseEvents.scheduledFor, end),
            inArray(doseEvents.status, RESOLVED),
          ),
        ),
    ]);

    const slotsByMed = new Map<string, typeof slots>();
    for (const slot of slots) {
      const list = slotsByMed.get(slot.medicationId) ?? [];
      list.push(slot);
      slotsByMed.set(slot.medicationId, list);
    }

    return medicationPerformance(
      meds.map((med) => ({
        id: med.id,
        name: med.name,
        color: med.color,
        frequencyLabel: frequencyLabelOf(slotsByMed.get(med.id) ?? []),
        events: rows
          .filter((r) => r.medicationId === med.id)
          .map((r) => ({ status: r.status, scheduledFor: r.scheduledFor, takenAt: r.takenAt, snoozeCount: r.snoozeCount ?? 0 })),
      })),
      timeZone,
    );
  },

  /** Time-of-day pattern table for the period (§10.5 buckets). */
  async patterns(db: DbClient, userId: string, timeZone: string, window: AdherenceWindow): Promise<TimeBucketStats[]> {
    await reconcileUser(db, userId, { now: now() });

    const start = combineDateAndTime(localDateKey(window.from, timeZone), "00:00", timeZone);
    const end = addLocalDays(combineDateAndTime(localDateKey(window.to, timeZone), "00:00", timeZone), 1, timeZone);
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
  },

  /** Trim the rollup history window (called from the scheduler once per user). */
  prune: pruneAdherence,
};