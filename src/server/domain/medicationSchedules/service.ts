import type { Db, DbTx } from "@/server/db/helpers";
import { listSlotsByMedicationIds } from "@/server/domain/medications/repo";
import { toScheduleSlotDTO } from "@/server/domain/medications/mapper";
import type { ScheduleSlotDTO } from "@/shared/types";

/**
 * Phase 12 — schedule read model (`server/domain/medicationSchedules`, §10.2).
 *
 * Owns the schedule-side facade the dose-event engine and read pages use: slots per
 * medication, sorted by time-of-day, DTO-mapped. Generation itself lives in
 * `doseEvents/service.ts` (ensure/void/extend) which consumes the pure
 * `shared/calc/schedule.expandSchedule`; this service must stay DB-read-only.
 */
export async function listScheduleSlots(db: Db | DbTx, medicationId: string): Promise<ScheduleSlotDTO[]> {
  const slots = await listSlotsByMedicationIds(db, [medicationId]);
  return slots.map(toScheduleSlotDTO);
}

/** All schedule slots across a set of medications, keyed by medicationId. */
export async function listSchedulesByMedicationIds(
  db: Db | DbTx,
  medicationIds: string[],
): Promise<Map<string, ScheduleSlotDTO[]>> {
  const slots = await listSlotsByMedicationIds(db, medicationIds);
  const byMed = new Map<string, ScheduleSlotDTO[]>();
  for (const slot of slots) {
    const bucket = byMed.get(slot.medicationId) ?? [];
    bucket.push(toScheduleSlotDTO(slot));
    byMed.set(slot.medicationId, bucket);
  }
  return byMed;
}