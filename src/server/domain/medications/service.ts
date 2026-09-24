import { TRPCError } from "@trpc/server";

import type { Db, DbTx } from "@/server/db/helpers";
import { DEFAULT_SLOT_TIMES } from "@/shared/constants";
import type { MedicationStatus } from "@/shared/enums";
import { localDateKey, now } from "@/shared/times";
import type { MedicationDTO } from "@/shared/types";
import type { MedicationInput } from "@/shared/validations/medication";
import type { ScheduleInput } from "@/shared/validations/schedule";
import { defaultSlot, toSlotInsert } from "./slot-builder";
import { toMedicationDTO } from "./mapper";
import {
  archiveMedication as repoArchive,
  findActiveByName,
  getMedicationById,
  insertMedication,
  listActiveMedications,
  listArchivedMedications,
  listSlotsByMedicationIds,
  replaceSlots,
  setMedicationStatus as repoSetStatus,
  updateMedication,
} from "./repo";
import { ensureDoseEvents, voidFutureEvents } from "../doseEvents/service";

export interface CreateMedicationArgs {
  /** Validated by `medicationSchema` at the router boundary. */
  medication: MedicationInput;
  /** Validated by `scheduleSchema`; omitted → default 08:00 daily slot (§10.1). */
  schedule?: ScheduleInput;
}

export interface UpdateMedicationArgs {
  id: string;
  medication: MedicationInput;
  schedule?: ScheduleInput;
}

export interface MedicationListResult {
  medications: MedicationDTO[];
  archived: MedicationDTO[];
}

const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Local `YYYY-MM-DD` for "today" (demo-aware clock, user's timezone). */
function todayKey(timezone: string): string {
  return localDateKey(now(), timezone);
}

export const medicationService = {
  /** All active meds + the archived bucket (§10.1 "non-archived + archived bucket"). */
  async list(db: Db | DbTx, userId: string): Promise<MedicationListResult> {
    const [meds, archived] = await Promise.all([
      listActiveMedications(db, userId),
      listArchivedMedications(db, userId),
    ]);
    const slotRows = await listSlotsByMedicationIds(
      db,
      [...meds, ...archived].map((m) => m.id),
    );
    const slotsByMed = new Map<string, (typeof slotRows)[number][]>();
    for (const slot of slotRows) {
      const bucket = slotsByMed.get(slot.medicationId) ?? [];
      bucket.push(slot);
      slotsByMed.set(slot.medicationId, bucket);
    }
    return {
      medications: meds.map((m) => toMedicationDTO(m, slotsByMed.get(m.id) ?? [])),
      archived: archived.map((m) => toMedicationDTO(m, slotsByMed.get(m.id) ?? [])),
    };
  },

  async get(db: Db | DbTx, userId: string, id: string): Promise<MedicationDTO> {
    const med = await getMedicationById(db, userId, id);
    if (!med) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });
    }
    const slots = await listSlotsByMedicationIds(db, [med.id]);
    return toMedicationDTO(med, slots);
  },

  /** create → master row + schedule slots + dose-event generation seam (§10.1). */
  async create(
    db: Db | DbTx,
    userId: string,
    timezone: string,
    { medication, schedule }: CreateMedicationArgs,
  ): Promise<MedicationDTO> {
    return db.transaction(async (tx) => {
      const existing = await findActiveByName(tx, userId, medication.name);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An active medication with this name already exists.",
        });
      }

      const id = await insertMedication(tx, {
        userId,
        name: medication.name,
        dosageAmount: String(medication.dosageAmount),
        dosageUnit: medication.dosageUnit,
        instructions: medication.instructions ?? null,
        notes: medication.notes ?? null,
        status: "active",
        startDate: medication.startDate,
        endDate: medication.endDate ?? null,
        color: medication.color,
        remindersEnabled: medication.remindersEnabled,
      });

      // §10.1: empty times/days → default a single 08:00 daily slot.
      const slotInserts = (schedule?.slots.length ? schedule.slots : [defaultSlot(DEFAULT_DAYS, DEFAULT_SLOT_TIMES[0]!)]).map(
        (s) => toSlotInsert(s, id),
      );
      await replaceSlots(tx, id, slotInserts);

      // Phase 12 realises this seam (idempotent `(medicationId, scheduledFor)` upsert).
      await ensureDoseEvents(tx, {
        userId,
        medicationId: id,
        from: medication.startDate,
        to: todayKey(timezone),
      });

      const rows = await listSlotsByMedicationIds(tx, [id]);
      const med = await getMedicationById(tx, userId, id);
      if (!med) throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });
      return toMedicationDTO(med, rows);
    });
  },

  /** update → mutable master fields + optional schedule diff (§10.1). */
  async update(
    db: Db | DbTx,
    userId: string,
    timezone: string,
    { id, medication, schedule }: UpdateMedicationArgs,
  ): Promise<MedicationDTO> {
    return db.transaction(async (tx) => {
      const med = await getMedicationById(tx, userId, id);
      if (!med) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });
      }
      if (med.archivedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Archived medications cannot be edited." });
      }

      const duplicate = await findActiveByName(tx, userId, medication.name, id);
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An active medication with this name already exists.",
        });
      }

      const updated = await updateMedication(tx, userId, id, {
        name: medication.name,
        dosageAmount: String(medication.dosageAmount),
        dosageUnit: medication.dosageUnit,
        instructions: medication.instructions ?? null,
        notes: medication.notes ?? null,
        startDate: medication.startDate,
        endDate: medication.endDate ?? null,
        color: medication.color,
        remindersEnabled: medication.remindersEnabled,
      });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });

      if (schedule?.slots) {
        // Diff: void anything generated from today onward, then regenerate (idempotent).
        await voidFutureEvents(tx, userId, id, todayKey(timezone));
        await replaceSlots(tx, id, schedule.slots.map((s) => toSlotInsert(s, id)));
        if (med.status === "active") {
          await ensureDoseEvents(tx, {
            userId,
            medicationId: id,
            from: med.startDate,
            to: todayKey(timezone),
          });
        }
      }

      const rows = await listSlotsByMedicationIds(tx, [id]);
      return toMedicationDTO(updated, rows);
    });
  },

  /** pause → void future unresolved events; resume → regenerate (§10.1). */
  async setStatus(
    db: Db | DbTx,
    userId: string,
    timezone: string,
    id: string,
    status: MedicationStatus,
  ): Promise<MedicationDTO> {
    return db.transaction(async (tx) => {
      const med = await getMedicationById(tx, userId, id);
      if (!med) throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });
      if (med.archivedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Archived medications cannot be resumed." });
      }

      await repoSetStatus(tx, userId, id, status);

      if (status === "paused") {
        await voidFutureEvents(tx, userId, id, todayKey(timezone));
      } else {
        await ensureDoseEvents(tx, {
          userId,
          medicationId: id,
          from: med.startDate,
          to: todayKey(timezone),
        });
      }

      const updated = await getMedicationById(tx, userId, id);
      const rows = await listSlotsByMedicationIds(tx, [id]);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });
      return toMedicationDTO(updated, rows);
    });
  },

  /** archive → soft delete; history preserved; future events voided (§8.3). */
  async archive(db: Db | DbTx, userId: string, id: string): Promise<MedicationDTO> {
    return db.transaction(async (tx) => {
      const med = await getMedicationById(tx, userId, id);
      if (!med) throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });

      const archived = await repoArchive(tx, userId, id);
      if (!archived) throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found." });

      await voidFutureEvents(tx, userId, id, todayKey("UTC"));

      const rows = await listSlotsByMedicationIds(tx, [id]);
      return toMedicationDTO(archived, rows);
    });
  },
};