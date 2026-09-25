/**
 * Phase 13 — missed-dose producer seam (§10.4 "missed (auto)").
 *
 * The reconcile missed-flow calls `onMissed` exactly once per event that actually flips
 * to `missed` (guarded by the conditional single-statement update, so producers never
 * double-fire). Phase 16 wired the in-app `missed_dose` notification; Phase 17 adds the
 * caregiver alerts (deduped per dose/relationship, permission-gated).
 */

import type { DbClient } from "@/server/db/helpers";
import { notificationsService } from "@/server/domain/notifications/service";
import { caregiverService } from "@/server/domain/caregiver/service";

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

/** Phase 16 + 17: `missed_dose` notification for the patient, caregiver alerts fan-out. */
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
    await caregiverService.createMissedDoseAlert(db, userId, event, at);
  },
};