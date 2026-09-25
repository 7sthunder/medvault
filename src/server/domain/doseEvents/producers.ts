/**
 * Phase 13 — missed-dose producer seam (§10.4 "missed (auto)").
 *
 * The reconcile missed-flow calls `onMissed` exactly once per event that actually flips
 * to `missed` (guarded by the conditional single-statement update, so producers never
 * double-fire). THIS PHASE ships a log-only no-op: the Phase 16 notifications domain and
 * Phase 17 caregiver-alert domain replace the body without touching reconcile.
 */

import type { DbClient } from "@/server/db/helpers";

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

/** Guarded no-op seam (log-only); wired to real producers in Phase 16/17. */
export const missedFlowProducers: MissedFlowProducers = {
  onMissed: (_db, userId, event, at) => {
    console.debug(
      `[reconcile] missed dose userId=${userId} event=${event.id} med=${event.medicationId} at=${at.toISOString()}`,
    );
  },
};