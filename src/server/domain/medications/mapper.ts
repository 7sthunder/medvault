/**
 * Phase 11 — Medication DTO mappers (plan §9, §10.1).
 *
 * Converts raw Drizzle rows from `medications` & `medication_schedules`
 * into canonical `MedicationDTO`, `ScheduleSlotDTO`, and `MedicationLite`.
 * Enforces numeric conversions and derives `frequencyLabel` via pure calculator.
 */

import type { medications, medicationSchedules } from "@/server/db/schema";
import { deriveFrequency } from "@/shared/calc/frequency";
import type { MedicationDTO, MedicationLite, ScheduleSlotDTO } from "@/shared/types";

export type MedicationRecord = typeof medications.$inferSelect;
export type ScheduleSlotRecord = typeof medicationSchedules.$inferSelect;

export interface MedicationExtra {
  nextDoseAt?: Date | null;
  adherencePercent?: number | null;
}

/**
 * Maps a single medication_schedules row to ScheduleSlotDTO.
 */
export function toScheduleSlotDTO(record: ScheduleSlotRecord): ScheduleSlotDTO {
  return {
    id: record.id,
    medicationId: record.medicationId,
    timeOfDay: record.timeOfDay,
    daysOfWeek: [...(record.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6])],
    dosageAmount:
      record.dosageAmount !== null && record.dosageAmount !== undefined
        ? Number(record.dosageAmount)
        : null,
    instructionOverride: record.instructionOverride ?? null,
    enabled: Boolean(record.enabled),
  };
}

/**
 * Maps a medication row + associated schedule slot rows into a full MedicationDTO.
 */
export function toMedicationDTO(
  med: MedicationRecord,
  slots: ScheduleSlotRecord[] = [],
  extra?: MedicationExtra,
): MedicationDTO {
  const sortedSlots = [...slots].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
  const slotDTOs = sortedSlots.map(toScheduleSlotDTO);

  const createdAt = med.createdAt instanceof Date ? med.createdAt : new Date(med.createdAt);
  const archivedAt = med.archivedAt
    ? med.archivedAt instanceof Date
      ? med.archivedAt
      : new Date(med.archivedAt)
    : null;

  return {
    id: med.id,
    name: med.name,
    dosageAmount: Number(med.dosageAmount),
    dosageUnit: med.dosageUnit,
    instructions: med.instructions ?? null,
    notes: med.notes ?? null,
    status: med.status,
    startDate: med.startDate,
    endDate: med.endDate ?? null,
    color: med.color,
    remindersEnabled: Boolean(med.remindersEnabled),
    archivedAt,
    createdAt,
    frequencyLabel: deriveFrequency(slotDTOs),
    slots: slotDTOs,
    nextDoseAt: extra?.nextDoseAt ?? null,
    adherencePercent: extra?.adherencePercent ?? null,
  };
}

/**
 * Maps a medication record or full DTO to lightweight MedicationLite.
 */
export function toMedicationLite(
  med: Pick<MedicationRecord, "id" | "name" | "dosageAmount" | "dosageUnit" | "color" | "archivedAt"> | MedicationDTO,
): MedicationLite {
  const archivedAt = med.archivedAt
    ? med.archivedAt instanceof Date
      ? med.archivedAt
      : new Date(med.archivedAt)
    : null;

  return {
    id: med.id,
    name: med.name,
    dosageAmount: typeof med.dosageAmount === "string" ? Number(med.dosageAmount) : med.dosageAmount,
    dosageUnit: med.dosageUnit,
    color: med.color,
    archivedAt,
  };
}
