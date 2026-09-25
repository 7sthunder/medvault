/**
 * Phase 15 — dashboard aggregation service (§11.4).
 *
 * The `/dashboard` page issues ONE tRPC call (`dashboard.get`) and receives the whole
 * `DashboardDTO`. This service composes the existing §10 domain services (schedule day,
 * adherence summary, medication list, insights + caregiver reads) so every number on the
 * dashboard is the *same* number the dedicated pages show — no secondary math in the UI.
 */

import { and, desc, eq, or } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { aiInsights, caregiverAlerts, caregiverRelationships } from "@/server/db/schema";
import { addLocalDays, combineDateAndTime, localDateKey, now } from "@/shared/times";
import type { DashboardCaregiverDTO, DashboardDTO, InsightDTO } from "@/shared/types";

import { medicationService } from "@/server/domain/medications/service";
import { scheduleService } from "@/server/domain/schedule/service";
import { adherenceService } from "@/server/domain/adherence/service";
import { adherencePercent } from "@/shared/calc/adherence";

/** §8.12 row → `InsightDTO` (the full insights service lands in Phase 17). */
export function toInsightDTO(row: typeof aiInsights.$inferSelect): InsightDTO {
  return {
    id: row.id,
    category: row.category,
    summary: row.summary,
    detail: row.detail,
    suggestedActionType: row.suggestedActionType,
    source: row.source,
    confidence: row.confidence == null ? null : Number(row.confidence),
    createdAt: row.createdAt,
  };
}

export const dashboardService = {
  /**
   * §11.4 `dashboard.get` — one reconciling read that fills every dashboard widget.
   * Percentages + streaks come from the same `adherenceService` the dedicated pages use;
   * the today feed is the canonical `scheduleService.day` (reconcile + catch-up built in).
   */
  async get(db: Db | DbTx, userId: string, timeZone: string): Promise<DashboardDTO> {
    const at = now();
    const todayKey = localDateKey(at, timeZone);

    const day = await scheduleService.day(db, userId, timeZone, todayKey);
    const today = day.events;

    const takenToday = today.filter((e) => e.status === "taken").length;
    const missedToday = today.filter((e) => e.status === "missed").length;
    const skippedToday = today.filter((e) => e.status === "skipped").length;
    const scheduledToday = takenToday + missedToday + skippedToday;

    const dueNow = today.filter((e) => e.status === "due-now");
    const nextDose =
      today.find(
        (e) => (e.status === "upcoming" || e.status === "due-now") && e.scheduledFor.getTime() >= at.getTime(),
      ) ?? null;

    // 7-day adherence window (same `AdherenceSummaryDTO` the /adherence page renders).
    const from = addLocalDays(dayStart(todayKey, timeZone), -6, timeZone);
    const to = combineDateAndTime(todayKey, "23:59", timeZone);
    const summary = await adherenceService.summary(db, userId, timeZone, { from, to });

    const list = await medicationService.list(db, userId, timeZone);
    const medications = list.medications;

    const [latestInsightRow] = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(desc(aiInsights.createdAt))
      .limit(1);

    const caregiver = await caregiverStats(db, userId);

    return {
      stats: {
        adherenceToday: adherencePercent({ taken: takenToday, missed: missedToday, skipped: skippedToday }),
        currentStreak: summary.streak.current,
        nextDoseTime: nextDose?.scheduledFor ?? null,
        missedToday,
        takenToday,
        scheduledToday,
      },
      dueNow,
      nextDose,
      today,
      week: summary.days,
      medications,
      latestInsight: latestInsightRow ? toInsightDTO(latestInsightRow) : null,
      caregiver,
    };
  },
};

/** Start-of-local-day instant (only used above; kept local to this module). */
function dayStart(dateKey: string, timeZone: string): Date {
  return combineDateAndTime(dateKey, "00:00", timeZone);
}

/** §11.4 caregiver widget counts: connections as patient + new alerts handed to me. */
async function caregiverStats(
  db: Db | DbTx,
  userId: string,
): Promise<DashboardCaregiverDTO> {
  const [patientRows, alertRows] = await Promise.all([
    db
      .select()
      .from(caregiverRelationships)
      .where(
        or(
          eq(caregiverRelationships.patientUserId, userId),
          eq(caregiverRelationships.caregiverUserId, userId),
        ),
      )
      .limit(50),
    db
      .select({ id: caregiverAlerts.id })
      .from(caregiverAlerts)
      .where(
        and(
          eq(caregiverAlerts.status, "new"),
          or(
            eq(caregiverAlerts.caregiverUserId, userId),
            eq(caregiverAlerts.patientUserId, userId),
          ),
        ),
      )
      .limit(50),
  ]);

  const connectedCount = patientRows.filter((r) => r.status === "active").length;
  // "new alerts" = caregiver alerts addressed to me (either role) that are not resolved.
  const newAlerts = alertRows.length;

  return { connectedCount, newAlerts };
}