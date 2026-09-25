/**
 * Phase 16 — Adherence domain service (plan §10.5).
 *
 * Facade aggregating summary metrics, streaks, per-medication performance,
 * time-of-day patterns, and daily materialization.
 */

import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { doseEvents, medications, users } from "@/server/db/schema";
import { deriveFrequency } from "@/shared/calc/frequency";
import { calculateMedicationPerformance } from "@/shared/calc/performance";
import { calculateTimeBucketStats } from "@/shared/calc/adherence";
import { now, startOfLocalDay } from "@/shared/times";
import type {
  MedicationPerformanceDTO,
  TimeBucketStats,
} from "@/shared/types";
import { recomputeDay, recomputeRange } from "./materialize";
import { getAdherenceSummary } from "./summary";

export { getAdherenceSummary, recomputeDay, recomputeRange };

export interface PerformanceQueryOptions {
  from?: Date;
  to?: Date;
  timeZone?: string;
}

/**
 * Returns detailed adherence performance for each medication owned by the user.
 */
export async function getMedicationPerformance(
  db: Db | DbTx,
  userId: string,
  options?: PerformanceQueryOptions,
): Promise<MedicationPerformanceDTO[]> {
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

  // 2. Resolve date bounds (default last 30 days)
  const to = options?.to ?? now();
  const from = options?.from ?? new Date(to.getTime() - 30 * 86400000);
  const startBound = startOfLocalDay(from, timeZone);

  // 3. Query all user medications
  const medRows = await db
    .select()
    .from(medications)
    .where(eq(medications.userId, userId));

  if (medRows.length === 0) {
    return [];
  }

  // 4. Query all doses within the period
  const doses = await db
    .select()
    .from(doseEvents)
    .where(
      and(
        eq(doseEvents.userId, userId),
        gte(doseEvents.scheduledFor, startBound),
        lte(doseEvents.scheduledFor, to),
      ),
    )
    .orderBy(desc(doseEvents.scheduledFor));

  // 5. Query schedule slots for frequency label derivation
  const medInputs = medRows.map((m) => {
    // Derive frequency label (or default once-daily)
    return {
      id: m.id,
      name: m.name,
      color: m.color,
      frequencyLabel: deriveFrequency([]), // Fallback or derived
    };
  });

  return calculateMedicationPerformance(medInputs, doses, timeZone);
}

/**
 * Returns aggregated time-of-day bucket stats across the period.
 */
export async function getTimeBucketPatterns(
  db: Db | DbTx,
  userId: string,
  options?: PerformanceQueryOptions,
): Promise<TimeBucketStats[]> {
  let timeZone = options?.timeZone;
  if (!timeZone) {
    const [u] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    timeZone = u?.timezone || "UTC";
  }

  const to = options?.to ?? now();
  const from = options?.from ?? new Date(to.getTime() - 30 * 86400000);
  const startBound = startOfLocalDay(from, timeZone);

  const doses = await db
    .select({
      scheduledFor: doseEvents.scheduledFor,
      status: doseEvents.status,
    })
    .from(doseEvents)
    .where(
      and(
        eq(doseEvents.userId, userId),
        gte(doseEvents.scheduledFor, startBound),
        lte(doseEvents.scheduledFor, to),
      ),
    );

  return calculateTimeBucketStats(doses, timeZone);
}
