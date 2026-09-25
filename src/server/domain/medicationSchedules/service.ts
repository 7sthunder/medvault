/**
 * Phase 12 — Medication schedules service & lifecycle orchestrator (plan §10.2).
 *
 * Subscribes to medication domain events (create, update, status change, archive, unarchive)
 * and orchestrates dose-event generation (`ensureDoseEvents`) and voiding (`voidFutureDoseEvents`).
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import type { Db, DbTx } from "@/server/db/helpers";
import { medications, medicationSchedules } from "@/server/db/schema";
import {
  ensureDoseEvents,
  voidFutureDoseEvents,
} from "@/server/domain/doseEvents/service";
import {
  registerMedicationChangeHandler,
  type MedicationChangeEvent,
} from "@/server/domain/medications/service";

/**
 * Handle a lifecycle event from the medication service.
 */
export async function handleMedicationChange(
  client: Db | DbTx,
  event: MedicationChangeEvent,
): Promise<void> {
  const { userId, medicationId, type } = event;

  switch (type) {
    case "created": {
      await ensureDoseEvents(client, { userId, medicationIds: [medicationId] });
      break;
    }

    case "updated": {
      // 1. Fetch remaining enabled schedule slots for this medication
      const currentSlots = await client
        .select({ id: medicationSchedules.id })
        .from(medicationSchedules)
        .where(
          and(
            eq(medicationSchedules.medicationId, medicationId),
            eq(medicationSchedules.enabled, true),
          ),
        );

      const validSlotIds = currentSlots.map((s) => s.id);

      // 2. Void future events from removed or disabled slots
      await voidFutureDoseEvents(client, {
        userId,
        medicationId,
        validScheduleIds: validSlotIds,
      });

      // 3. Expand new/existing slots across the horizon
      await ensureDoseEvents(client, { userId, medicationIds: [medicationId] });
      break;
    }

    case "status_changed": {
      const medRows = await client
        .select({ status: medications.status })
        .from(medications)
        .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
        .limit(1);

      if (medRows[0]?.status === "paused") {
        await voidFutureDoseEvents(client, { userId, medicationId });
      } else if (medRows[0]?.status === "active") {
        await ensureDoseEvents(client, { userId, medicationIds: [medicationId] });
      }
      break;
    }

    case "archived": {
      await voidFutureDoseEvents(client, { userId, medicationId });
      break;
    }

    case "unarchived": {
      await ensureDoseEvents(client, { userId, medicationIds: [medicationId] });
      break;
    }
  }
}

// Auto-register lifecycle hook with default db client
registerMedicationChangeHandler(async (event) => {
  await handleMedicationChange(db, event);
});
