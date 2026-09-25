/**
 * Phase 13 — missed-dose producer seam (§10.4 "missed (auto)").
 *
 * The reconcile missed-flow calls `onMissed` exactly once per event that actually flips
 * to `missed` (guarded by the conditional single-statement update, so producers never
 * double-fire). Wired in Phase 16: `onMissed` opens a `missed_dose` notification through
 * the notifications domain (preference-gated + once-per-entity deduped). Phase 17 adds
 * the caregiver alert on top.
 */

import type { DbClient } from "@/server/db/helpers";
import { notificationsService } from "@/server/domain/notifications/service";

/** Stable identity handed to producers — enough to open notifications/alerts later. */
export interface MissedDoseRef {
  id: string;
  medicationId: string;
  scheduledFor: Date;
  missedDeadline: Date;
}

export interface MissedFlowProducers {
  onMissed: (db: DbClient, userId: string, event: MissedDoseRef, at: Date) => Promise<void> | void;
}

/** Phase 16: missed dose → `missed_dose` notification (gated + deduped). */
export const missedFlowProducers: MissedFlowProducers = {
  onMissed: async (db, userId, event, at) => {
    await notificationsService.create(db, {
      userId,
      type: "missed_dose",
      title: "Missed dose",
      body: `A dose scheduled for ${event.scheduledFor.toISOString()} was missed.`,
      entityType: "doseEvent",
      entityId: event.id,
      createdAt: at,
    });
  },
};