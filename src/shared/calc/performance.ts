/**
 * Phase 13 — pure per-medication performance (§10.5).
 *
 * Aggregates one `MedicationPerformanceDTO` per medication from its resolved dose events:
 * totals, adherence%, best/worst time-of-day bucket (by rate, ties → more scheduled) and
 * the last taken instant.
 */

import type { DoseEventStatus, FrequencyLabel, TimeBucket } from "../enums";
import type { MedicationPerformanceDTO } from "../types";
import { adherencePercent, bucketStats } from "./adherence";

export interface PerformanceEvent {
  status: DoseEventStatus;
  scheduledFor: Date;
  /** `null` unless the event was taken. */
  takenAt: Date | null;
  snoozeCount: number;
}

export interface PerformanceMedication {
  id: string;
  name: string;
  color: string;
  frequencyLabel: FrequencyLabel;
  events: readonly PerformanceEvent[];
}

const RESOLVED: readonly DoseEventStatus[] = ["taken", "missed", "skipped"];

export function medicationPerformance(
  meds: readonly PerformanceMedication[],
  timeZone: string,
): MedicationPerformanceDTO[] {
  return meds
    .map((med) => {
      const resolved = med.events.filter((e) => (RESOLVED as readonly DoseEventStatus[]).includes(e.status));
      const taken = resolved.filter((e) => e.status === "taken");

      const counts = {
        scheduled: resolved.length,
        taken: taken.length,
        missed: resolved.filter((e) => e.status === "missed").length,
        skipped: resolved.filter((e) => e.status === "skipped").length,
      };

      const ranked = bucketStats(resolved, timeZone)
        .filter((b) => b.scheduled > 0)
        .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || b.scheduled - a.scheduled);

      const bestBucket: TimeBucket | null = ranked[0] ? ranked[0]!.bucket : null;
      const worstBucket: TimeBucket | null = ranked.length
        ? ranked[ranked.length - 1]!.bucket
        : null;

      const takenInstants = taken
        .map((e) => e.takenAt?.getTime())
        .filter((v): v is number => v !== undefined && v !== null);
      const lastTakenAt = takenInstants.length ? new Date(Math.max(...takenInstants)) : null;

      return {
        medicationId: med.id,
        name: med.name,
        color: med.color,
        frequencyLabel: med.frequencyLabel,
        ...counts,
        adherencePercent: adherencePercent(counts),
        bestBucket,
        worstBucket,
        lastTakenAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}