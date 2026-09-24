import type { medicationSchedules } from "@/server/db/schema";
import { uuidv7 } from "@/server/db/helpers";
import type { ScheduleSlotInput } from "@/shared/validations/schedule";

type SlotInsert = typeof medicationSchedules.$inferInsert;

/**
 * A single slot used as the §10.1 default when a schedule arrives with no times:
 * 08:00 every day, dosage inherited from the medication itself (null override).
 */
export function defaultSlot(daysOfWeek: number[], timeOfDay: string): ScheduleSlotInput {
  return {
    timeOfDay,
    daysOfWeek,
    dosageAmount: null,
    instructionOverride: null,
    enabled: true,
  };
}

/** Map a validated slot input to a `medication_schedules` insert row. */
export function toSlotInsert(slot: ScheduleSlotInput, medicationId: string): SlotInsert {
  return {
    id: uuidv7(),
    medicationId,
    timeOfDay: slot.timeOfDay,
    daysOfWeek: slot.daysOfWeek,
    dosageAmount: slot.dosageAmount == null ? null : String(slot.dosageAmount),
    instructionOverride: slot.instructionOverride ?? null,
    enabled: slot.enabled,
  };
}