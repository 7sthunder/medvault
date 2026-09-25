/**
 * Phase 18 — Dashboard aggregation service (plan §11.4, §10 services).
 *
 * Aggregates all landing surface data in a single round-trip:
 * - Status reconciliation & dose event horizon ensuring
 * - Today's dose feed & due-now classification
 * - Next unresolved dose (today or nearest future)
 * - Today's adherence & current streak
 * - 7-day adherence week series
 * - Active medications summary
 * - AI insight preview stub (Phase 24 bridge)
 * - Caregiver status stub (Phase 21 bridge)
 */

import { and, asc, eq, gt, gte, inArray, lte } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { doseEvents, medications, users } from "@/server/db/schema";
import { calculateAdherencePercent } from "@/shared/calc/adherence";
import {
  combineDateAndTime,
  localDateKey,
  now,
  startOfLocalDay,
} from "@/shared/times";
import type {
  DashboardCaregiverDTO,
  DashboardDTO,
  DashboardStatsDTO,
  DoseEventDTO,
  InsightDTO,
} from "@/shared/types";
import { getAdherenceSummary } from "@/server/domain/adherence/summary";
import { toDoseEventDTO } from "@/server/domain/doseEvents/mapper";
import { reconcileDoseStatuses } from "@/server/domain/doseEvents/reconcile";
import { ensureDoseEvents } from "@/server/domain/doseEvents/service";
import { listMedications } from "@/server/domain/medications/service";

export interface GetDashboardDataOptions {
  timeZone?: string;
}

export async function getDashboardData(
  db: Db | DbTx,
  userId: string,
  options?: GetDashboardDataOptions,
): Promise<DashboardDTO> {
  // 1. Resolve user timezone
  let timeZone = options?.timeZone;
  if (!timeZone) {
    const userRow = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    timeZone = userRow[0]?.timezone || "UTC";
  }

  // 2. Ensure dose events exist across the horizon and reconcile past-due statuses
  await ensureDoseEvents(db, { userId, timeZone });
  await reconcileDoseStatuses(db, { userId });

  // 3. Define local today boundaries
  const currentNow = now();
  const todayKey = localDateKey(currentNow, timeZone);
  const startOfDay = startOfLocalDay(currentNow, timeZone);
  const endOfDay = combineDateAndTime(todayKey, "23:59", timeZone);

  // 4. Query today's doses
  const todayDoseRows = await db
    .select()
    .from(doseEvents)
    .where(
      and(
        eq(doseEvents.userId, userId),
        gte(doseEvents.scheduledFor, startOfDay),
        lte(doseEvents.scheduledFor, endOfDay),
      ),
    )
    .orderBy(asc(doseEvents.scheduledFor));

  // 5. Query active medications
  const activeMeds = await listMedications(db, userId, { status: "active" });

  // 6. Map today's doses with medication snapshots
  const allUserMeds = await db
    .select()
    .from(medications)
    .where(eq(medications.userId, userId));
  const medsById = new Map(allUserMeds.map((m) => [m.id, m]));

  const todayDoses: DoseEventDTO[] = [];
  for (const row of todayDoseRows) {
    const med = medsById.get(row.medicationId);
    if (med) {
      todayDoses.push(toDoseEventDTO(row, med));
    }
  }

  // 7. Calculate today's dose statistics
  let takenToday = 0;
  let missedToday = 0;
  let skippedToday = 0;
  let scheduledToday = 0;

  for (const d of todayDoses) {
    if (d.status === "canceled") continue;
    scheduledToday += 1;
    if (d.status === "taken") takenToday += 1;
    else if (d.status === "missed") missedToday += 1;
    else if (d.status === "skipped") skippedToday += 1;
  }

  const resolvedToday = takenToday + missedToday + skippedToday;
  const adherenceToday =
    resolvedToday > 0
      ? calculateAdherencePercent(takenToday, resolvedToday)
      : null;

  // 8. Classify due-now and find next dose
  // Due now includes any doses currently in "due" or "snoozed" status
  const dueNow = todayDoses.filter(
    (d) => d.status === "due" || d.status === "snoozed",
  );

  let nextDose: DoseEventDTO | null = null;
  // Earliest unresolved dose today:
  const unresolvedToday = todayDoses.filter(
    (d) =>
      d.status === "due" ||
      d.status === "snoozed" ||
      d.status === "upcoming",
  );

  if (unresolvedToday.length > 0) {
    nextDose = unresolvedToday[0] ?? null;
  } else {
    // If no unresolved doses remain today, look for the next future unresolved dose
    const futureDoseRows = await db
      .select()
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.userId, userId),
          gt(doseEvents.scheduledFor, endOfDay),
          inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
        ),
      )
      .orderBy(asc(doseEvents.scheduledFor))
      .limit(1);

    if (futureDoseRows.length > 0) {
      const futureRow = futureDoseRows[0];
      const med = futureRow ? medsById.get(futureRow.medicationId) : undefined;
      if (futureRow && med) {
        nextDose = toDoseEventDTO(futureRow, med);
      }
    }
  }

  // 9. Fetch 7-day adherence summary for week trend and streak
  const adherenceSummary = await getAdherenceSummary(db, userId, {
    rangePreset: "7d",
    timeZone,
  });

  const stats: DashboardStatsDTO = {
    adherenceToday,
    currentStreak: adherenceSummary.streak.current,
    nextDoseTime: nextDose ? new Date(nextDose.scheduledFor) : null,
    missedToday,
    takenToday,
    scheduledToday,
  };

  // 10. AI insight preview stub (Phase 24 will fill with personalized generative insights)
  const latestInsight: InsightDTO | null =
    activeMeds.length > 0
      ? {
          id: "stub-insight-dashboard",
          category: "timing_pattern",
          summary: "High consistency on morning doses",
          detail:
            "You have maintained consistent timing on your morning medications. Consistency enhances medication efficacy.",
          suggestedActionType: "review_schedule",
          source: "fallback",
          confidence: 0.94,
          createdAt: currentNow,
        }
      : null;

  // 11. Caregiver status stub (Phase 21 will fill with real caregiver network state)
  const caregiver: DashboardCaregiverDTO = {
    connectedCount: 0,
    newAlerts: 0,
  };

  return {
    stats,
    dueNow,
    nextDose,
    today: todayDoses,
    week: adherenceSummary.days,
    medications: activeMeds,
    latestInsight,
    caregiver,
  };
}
