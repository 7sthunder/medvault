import type { medications, medicationSchedules } from "@/server/db/schema";
import type { FrequencyLabel } from "@/shared/enums";
import type { MedicationDTO, MedicationLite, ScheduleSlotDTO } from "@/shared/types";

type MedRow = typeof medications.$inferSelect;
type SlotRow = typeof medicationSchedules.$inferSelect;

const FULL_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

function isFullWeek(slot: Pick<SlotRow, "daysOfWeek">): boolean {
  return (
    slot.daysOfWeek.length === FULL_WEEK.length &&
    FULL_WEEK.every((day) => slot.daysOfWeek.includes(day))
  );
}

/**
 * §8.4 label derivation from the medication's schedule slots. "once-daily" / "twice-daily"
 * / "n-times-daily" only apply when every enabled slot runs the full week; any non-weekly
 * day set (or a paused/disabled schedule) is "custom-weekdays".
 */
export function frequencyLabelOf(slots: readonly Pick<SlotRow, "enabled" | "daysOfWeek">[]): FrequencyLabel {
  const enabled = slots.filter((slot) => slot.enabled);
  if (enabled.length > 0 && enabled.every(isFullWeek)) {
    if (enabled.length === 1) return "once-daily";
    if (enabled.length === 2) return "twice-daily";
    return "n-times-daily";
  }
  return "custom-weekdays";
}

export function toScheduleSlotDTO(row: SlotRow): ScheduleSlotDTO {
  return {
    id: row.id,
    medicationId: row.medicationId,
    timeOfDay: row.timeOfDay,
    daysOfWeek: row.daysOfWeek,
    dosageAmount: row.dosageAmount == null ? null : Number(row.dosageAmount),
    instructionOverride: row.instructionOverride,
    enabled: row.enabled,
  };
}

export function toMedicationLite(row: MedRow): MedicationLite {
  return {
    id: row.id,
    name: row.name,
    dosageAmount: Number(row.dosageAmount),
    dosageUnit: row.dosageUnit,
    color: row.color,
    archivedAt: row.archivedAt,
  };
}

/** Extras filled by downstream joins (dose events, adherence) — null until those services exist. */
export interface MedicationDTOExtras {
  nextDoseAt?: Date | null;
  adherencePercent?: number | null;
}

export function toMedicationDTO(row: MedRow, slots: SlotRow[], extras: MedicationDTOExtras = {}): MedicationDTO {
  return {
    id: row.id,
    name: row.name,
    dosageAmount: Number(row.dosageAmount),
    dosageUnit: row.dosageUnit,
    instructions: row.instructions,
    notes: row.notes,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    color: row.color,
    remindersEnabled: row.remindersEnabled,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    frequencyLabel: frequencyLabelOf(slots),
    slots: slots
      .map(toScheduleSlotDTO)
      .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay)),
    nextDoseAt: extras.nextDoseAt ?? null,
    adherencePercent: extras.adherencePercent ?? null,
  };
}