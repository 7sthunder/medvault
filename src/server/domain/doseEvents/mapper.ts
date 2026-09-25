/**
 * Phase 13 — Dose event & action DTO mappers (plan §9).
 *
 * Maps Drizzle `dose_events` and `dose_actions` rows with embedded `medication`
 * lite snapshots into canonical `DoseEventDTO` and `DoseActionDTO`.
 */

import type { doseActions, doseEvents } from "@/server/db/schema";
import { toMedicationLite, type MedicationRecord } from "@/server/domain/medications/mapper";
import type { DoseActionDTO, DoseEventDTO, MedicationDTO, MedicationLite } from "@/shared/types";

export type DoseEventRecord = typeof doseEvents.$inferSelect;
export type DoseActionRecord = typeof doseActions.$inferSelect;

/**
 * Maps a dose_events record + associated medication into DoseEventDTO.
 */
export function toDoseEventDTO(
  event: DoseEventRecord,
  medication: MedicationRecord | MedicationDTO | MedicationLite,
): DoseEventDTO {
  const medLite = "dosageAmount" in medication && typeof medication.dosageAmount === "number" && "color" in medication
    ? (medication as MedicationLite)
    : toMedicationLite(medication as MedicationRecord);

  return {
    id: event.id,
    medicationId: event.medicationId,
    scheduleId: event.scheduleId ?? null,
    scheduledFor: event.scheduledFor instanceof Date ? event.scheduledFor : new Date(event.scheduledFor),
    status: event.status,
    missedDeadline: event.missedDeadline
      ? event.missedDeadline instanceof Date
        ? event.missedDeadline
        : new Date(event.missedDeadline)
      : null,
    takenAt: event.takenAt
      ? event.takenAt instanceof Date
        ? event.takenAt
        : new Date(event.takenAt)
      : null,
    skippedAt: event.skippedAt
      ? event.skippedAt instanceof Date
        ? event.skippedAt
        : new Date(event.skippedAt)
      : null,
    skippedReason: event.skippedReason ?? null,
    snoozeCount: event.snoozeCount,
    snoozeUntil: event.snoozeUntil
      ? event.snoozeUntil instanceof Date
        ? event.snoozeUntil
        : new Date(event.snoozeUntil)
      : null,
    statusUpdatedAt:
      event.statusUpdatedAt instanceof Date
        ? event.statusUpdatedAt
        : new Date(event.statusUpdatedAt),
    source: event.source,
    medication: medLite,
  };
}

/**
 * Maps a dose_actions record into DoseActionDTO with embedded medication snapshot.
 */
export function toDoseActionDTO(
  action: DoseActionRecord,
  event: Pick<DoseEventRecord, "status" | "scheduledFor">,
  medication: MedicationRecord | MedicationDTO | MedicationLite,
): DoseActionDTO {
  const medLite = "dosageAmount" in medication && typeof medication.dosageAmount === "number" && "color" in medication
    ? (medication as MedicationLite)
    : toMedicationLite(medication as MedicationRecord);

  return {
    id: action.id,
    doseEventId: action.doseEventId,
    action: action.action,
    occurredAt: action.occurredAt instanceof Date ? action.occurredAt : new Date(action.occurredAt),
    meta: (action.meta as Record<string, unknown> | null) ?? null,
    medication: medLite,
    eventStatus: event.status,
    eventScheduledFor:
      event.scheduledFor instanceof Date ? event.scheduledFor : new Date(event.scheduledFor),
  };
}
