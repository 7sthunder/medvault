/**
 * Phase 16 — Pure adherence percentage and time-of-day bucket calculations (plan §10.5).
 */

import { TIME_BUCKETS, type TimeBucket } from "../enums";
import type { TimeBucketStats } from "../types";

/**
 * Calculates adherence rate rounded to 1 decimal place.
 * Formula: taken / (taken + missed + skipped) * 100.
 * Returns null if no doses are scheduled/resolved (guard: empty period -> null).
 */
export function calculateAdherencePercent(
  taken: number,
  totalResolved: number,
): number | null {
  if (totalResolved <= 0) {
    return null;
  }
  const pct = (taken / totalResolved) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Determines the time bucket for a given 24h local hour (0-23).
 * Edges per plan §10.5:
 * - Morning: < 12 (00:00 - 11:59)
 * - Afternoon: 12 <= hour < 17 (12:00 - 16:59)
 * - Evening: 17 <= hour < 21 (17:00 - 20:59)
 * - Night: >= 21 (21:00 - 23:59)
 */
export function bucketOfHour(hour: number): TimeBucket {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export interface BucketDoseInput {
  scheduledFor: Date;
  status: string;
}

/**
 * Aggregates doses into the 4 standard time-of-day buckets.
 */
export function calculateTimeBucketStats(
  doses: BucketDoseInput[],
  timeZone: string = "UTC",
): TimeBucketStats[] {
  const bucketMap: Record<
    TimeBucket,
    { scheduled: number; taken: number; missed: number }
  > = {
    morning: { scheduled: 0, taken: 0, missed: 0 },
    afternoon: { scheduled: 0, taken: 0, missed: 0 },
    evening: { scheduled: 0, taken: 0, missed: 0 },
    night: { scheduled: 0, taken: 0, missed: 0 },
  };

  for (const dose of doses) {
    const isResolved =
      dose.status === "taken" ||
      dose.status === "missed" ||
      dose.status === "skipped";

    if (!isResolved) continue;

    // Convert scheduledFor into hour in user's timezone
    const date = new Date(dose.scheduledFor);
    const hourStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(date);
    const hour = parseInt(hourStr, 10);
    const bucket = bucketOfHour(hour);

    bucketMap[bucket].scheduled += 1;
    if (dose.status === "taken") {
      bucketMap[bucket].taken += 1;
    } else if (dose.status === "missed") {
      bucketMap[bucket].missed += 1;
    }
  }

  return TIME_BUCKETS.map((bucket) => {
    const b = bucketMap[bucket];
    return {
      bucket,
      scheduled: b.scheduled,
      taken: b.taken,
      missed: b.missed,
      rate: calculateAdherencePercent(b.taken, b.scheduled),
    };
  });
}
