/**
 * Phase 16 — Pure medication performance and adherence trend calculations (plan §10.5).
 */

import { calculateAdherencePercent, calculateTimeBucketStats } from "./adherence";
import type { FrequencyLabel, TimeBucket } from "../enums";
import type {
  MedicationPerformanceDTO,
  TrendDirection,
  TrendDTO,
} from "../types";

export interface TrendDayInput {
  date: string;
  adherencePercent: number | null;
}

/**
 * Computes rolling 7-day average and trend direction (improving, declining, stable).
 */
export function calculateTrend(dailySeries: TrendDayInput[]): TrendDTO {
  const sorted = [...dailySeries].sort((a, b) => a.date.localeCompare(b.date));

  const rolling7 = sorted.map((day, i) => {
    const windowStart = Math.max(0, i - 6);
    const window = sorted.slice(windowStart, i + 1);
    const valid = window.filter((d) => d.adherencePercent !== null);

    if (valid.length === 0) {
      return { date: day.date, value: null };
    }

    const sum = valid.reduce((acc, curr) => acc + (curr.adherencePercent ?? 0), 0);
    const avg = Math.round((sum / valid.length) * 10) / 10;
    return { date: day.date, value: avg };
  });

  // Calculate current 7-day avg vs prior 7-day avg
  const nonNullDays = sorted.filter((d) => d.adherencePercent !== null);
  let current7: number | null = null;
  let prior7: number | null = null;

  if (nonNullDays.length >= 1) {
    const currentSlice = nonNullDays.slice(-7);
    const currentSum = currentSlice.reduce((acc, d) => acc + (d.adherencePercent ?? 0), 0);
    current7 = Math.round((currentSum / currentSlice.length) * 10) / 10;
  }

  if (nonNullDays.length >= 8) {
    const priorSlice = nonNullDays.slice(-14, -7);
    const priorSum = priorSlice.reduce((acc, d) => acc + (d.adherencePercent ?? 0), 0);
    prior7 = Math.round((priorSum / priorSlice.length) * 10) / 10;
  }

  let direction: TrendDirection = "stable";
  if (current7 !== null && prior7 !== null) {
    const diff = current7 - prior7;
    if (diff > 2.0) {
      direction = "improving";
    } else if (diff < -2.0) {
      direction = "declining";
    } else {
      direction = "stable";
    }
  }

  return {
    daily: sorted.map((d) => ({ date: d.date, adherencePercent: d.adherencePercent })),
    rolling7,
    direction,
    current7,
    prior7,
  };
}

export interface MedPerformanceMedInput {
  id: string;
  name: string;
  color: string;
  frequencyLabel: FrequencyLabel;
}

export interface MedPerformanceDoseInput {
  medicationId: string;
  status: string;
  scheduledFor: Date;
  takenAt?: Date | null;
}

/**
 * Calculates per-medication adherence performance, best/worst bucket, and last taken timestamp.
 */
export function calculateMedicationPerformance(
  medications: MedPerformanceMedInput[],
  doses: MedPerformanceDoseInput[],
  timeZone: string = "UTC",
): MedicationPerformanceDTO[] {
  return medications.map((med) => {
    const medDoses = doses.filter((d) => d.medicationId === med.id);
    const resolved = medDoses.filter(
      (d) => d.status === "taken" || d.status === "missed" || d.status === "skipped",
    );

    const taken = resolved.filter((d) => d.status === "taken").length;
    const missed = resolved.filter((d) => d.status === "missed").length;
    const skipped = resolved.filter((d) => d.status === "skipped").length;
    const scheduled = resolved.length;

    const adherencePercent = calculateAdherencePercent(taken, scheduled);

    // Calculate time bucket rates for this medication
    const bucketStats = calculateTimeBucketStats(medDoses, timeZone);
    const activeBuckets = bucketStats.filter((b) => b.scheduled > 0 && b.rate !== null);

    let bestBucket: TimeBucket | null = null;
    let worstBucket: TimeBucket | null = null;

    if (activeBuckets.length > 0) {
      const sortedByRate = [...activeBuckets].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
      bestBucket = sortedByRate[0]?.bucket ?? null;
      worstBucket = sortedByRate[sortedByRate.length - 1]?.bucket ?? null;
    }

    // Last taken timestamp
    const takenDoses = medDoses.filter((d) => d.status === "taken" && d.takenAt);
    let lastTakenAt: Date | null = null;
    if (takenDoses.length > 0) {
      const sortedByTakenAt = [...takenDoses].sort(
        (a, b) => new Date(b.takenAt!).getTime() - new Date(a.takenAt!).getTime(),
      );
      lastTakenAt = sortedByTakenAt[0]?.takenAt ? new Date(sortedByTakenAt[0].takenAt) : null;
    }

    return {
      medicationId: med.id,
      name: med.name,
      color: med.color,
      frequencyLabel: med.frequencyLabel,
      scheduled,
      taken,
      missed,
      skipped,
      adherencePercent,
      bestBucket,
      worstBucket,
      lastTakenAt,
    };
  });
}
