/**
 * Phase 13 — Missed-dose scanner and status reconciliation (plan §10.3).
 *
 * Scans for doses whose missedDeadline has elapsed, marks them missed,
 * records `missed_auto` in the audit log, and invokes registered missed-dose
 * handlers (notifications, caregiver alerts seam).
 * Also advances `upcoming -> due` and expired `snoozed -> due`.
 */

import { and, eq, inArray, lt, lte } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { doseActions, doseEvents } from "@/server/db/schema";
import { now } from "@/shared/times";
import { runMissedDoseHandlers } from "./attachments";

export interface ReconcileOptions {
  userId?: string;
  now?: Date;
}

export interface ReconcileResult {
  autoMissedCount: number;
  dueTransitionCount: number;
}

/**
 * Reconciles unresolved dose events against the current clock.
 */
export async function reconcileDoseStatuses(
  db: Db | DbTx,
  options?: ReconcileOptions,
): Promise<ReconcileResult> {
  const currentNow = options?.now ?? now();

  // ── 1. Detect and auto-transition missed doses ─────────────────────────────
  const missedConditions = [
    inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
    lt(doseEvents.missedDeadline, currentNow),
  ];

  if (options?.userId) {
    missedConditions.push(eq(doseEvents.userId, options.userId));
  }

  const missedRows = await db
    .select()
    .from(doseEvents)
    .where(and(...missedConditions));

  let autoMissedCount = 0;

  for (const row of missedRows) {
    // Atomic update status -> missed
    const [updated] = await db
      .update(doseEvents)
      .set({
        status: "missed",
        statusUpdatedAt: currentNow,
      })
      .where(
        and(
          eq(doseEvents.id, row.id),
          inArray(doseEvents.status, ["upcoming", "due", "snoozed"]),
        ),
      )
      .returning();

    if (updated) {
      autoMissedCount++;

      // Log append-only audit record
      await db.insert(doseActions).values({
        id: uuidv7(),
        userId: row.userId,
        doseEventId: row.id,
        action: "missed_auto",
        occurredAt: currentNow,
        meta: null,
      });

      // Fire missed dose seam (Phase 13 hook for notifications / caregiver alerts)
      await runMissedDoseHandlers({
        userId: row.userId,
        medicationId: row.medicationId,
        doseEventId: row.id,
        scheduledFor: row.scheduledFor,
      });
    }
  }

  // ── 2. Transition upcoming -> due ──────────────────────────────────────────
  const upcomingConditions = [
    eq(doseEvents.status, "upcoming"),
    lte(doseEvents.scheduledFor, currentNow),
  ];

  if (options?.userId) {
    upcomingConditions.push(eq(doseEvents.userId, options.userId));
  }

  const transitionedUpcoming = await db
    .update(doseEvents)
    .set({
      status: "due",
      statusUpdatedAt: currentNow,
    })
    .where(and(...upcomingConditions))
    .returning({ id: doseEvents.id });

  // ── 3. Transition expired snoozed -> due ───────────────────────────────────
  const snoozedConditions = [
    eq(doseEvents.status, "snoozed"),
    lte(doseEvents.snoozeUntil, currentNow),
  ];

  if (options?.userId) {
    snoozedConditions.push(eq(doseEvents.userId, options.userId));
  }

  const transitionedSnoozed = await db
    .update(doseEvents)
    .set({
      status: "due",
      statusUpdatedAt: currentNow,
    })
    .where(and(...snoozedConditions))
    .returning({ id: doseEvents.id });

  return {
    autoMissedCount,
    dueTransitionCount: transitionedUpcoming.length + transitionedSnoozed.length,
  };
}
