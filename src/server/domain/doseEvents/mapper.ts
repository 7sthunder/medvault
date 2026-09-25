import type { doseActions, doseEvents, medications } from "@/server/db/schema";
import type { DoseEventStatus, DoseStatus } from "@/shared/enums";
import { deriveNextStatus } from "@/shared/calc/doseState";
import type { DoseActionDTO, DoseEventDTO, MedicationLite } from "@/shared/types";

import { toMedicationLite } from "@/server/domain/medications/mapper";

type MedRow = typeof medications.$inferSelect;
type EventRow = typeof doseEvents.$inferSelect;
type ActionRow = typeof doseActions.$inferSelect;

/**
 * The display status a dose should show at `now` — `due` (persisted) is rendered as
 * the §12 "due-now" chip so the UI pulses overdue doses without mutating persisted rows.
 * Terminal statuses (taken/missed/skipped/canceled) pass through unchanged.
 */
export function displayStatusOf(
  event: Pick<typeof doseEvents.$inferSelect, "status" | "scheduledFor" | "missedDeadline" | "snoozeUntil">,
  now: Date,
  missedAfterMinutes: number,
): DoseStatus {
  if (event.status === "due") return "due-now";
  // `deriveNextStatus` only ever yields persistent statuses; "due" is rendered as the
  // §12 "due-now" chip and everything else maps 1:1 into the display set.
  return deriveNextStatus(event, now, missedAfterMinutes).status as DoseStatus;
}

export function toDoseEventDTO(
  event: EventRow,
  med: MedRow,
  opts: { now: Date; missedAfterMinutes: number },
): DoseEventDTO {
  return {
    id: event.id,
    medicationId: event.medicationId,
    scheduleId: event.scheduleId,
    scheduledFor: event.scheduledFor,
    status: displayStatusOf(event, opts.now, opts.missedAfterMinutes),
    missedDeadline: event.missedDeadline,
    takenAt: event.takenAt,
    skippedAt: event.skippedAt,
    skippedReason: event.skippedReason,
    snoozeCount: event.snoozeCount,
    snoozeUntil: event.snoozeUntil,
    statusUpdatedAt: event.statusUpdatedAt,
    source: event.source,
    medication: toMedicationLite(med),
  };
}

export function toDoseActionDTO(
  action: ActionRow,
  med: MedRow,
  opts: { eventStatus: DoseEventStatus; eventScheduledFor: Date },
): DoseActionDTO {
  return {
    id: action.id,
    doseEventId: action.doseEventId,
    action: action.action,
    occurredAt: action.occurredAt,
    meta: (action.meta ?? null) as Record<string, unknown> | null,
    medication: toMedicationLite(med),
    eventStatus: opts.eventStatus,
    eventScheduledFor: opts.eventScheduledFor,
  };
}

/** Lightweight medication lookup map for joins (avoids N+1 selects). */
export type MedicationLiteMap = Map<string, MedRow>;

export function toMedicationLiteMap(rows: MedRow[]): MedicationLiteMap {
  return new Map(rows.map((med) => [med.id, med]));
}

export type { MedicationLite };