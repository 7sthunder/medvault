/**
 * Phase 11 — Medication domain service (plan §10.1).
 *
 * Implements full medication lifecycle, ownership enforcement, duplicate-name
 * prevention, transactional schedule-slot synchronization, and the Phase 12/13
 * event generation hook seam.
 */

import { TRPCError } from "@trpc/server";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import type { MedicationStatus } from "@/shared/enums";
import type { MedicationDTO } from "@/shared/types";
import { DEFAULT_MED_COLOR } from "@/shared/validations/medication";
import { toMedicationDTO } from "./mapper";
import * as repo from "./repo";

/* ── Phase 12 / 13 Hook Seam ─────────────────────────────────────────────── */

export interface MedicationChangeEvent {
  userId: string;
  medicationId: string;
  type: "created" | "updated" | "status_changed" | "archived" | "unarchived";
}

export type MedicationChangeHandler = (event: MedicationChangeEvent) => Promise<void> | void;

const changeHandlers = new Set<MedicationChangeHandler>();

export function registerMedicationChangeHandler(handler: MedicationChangeHandler): void {
  changeHandlers.add(handler);
}

export function clearMedicationChangeHandlers(): void {
  changeHandlers.clear();
}

export async function notifyMedicationChanged(event: MedicationChangeEvent): Promise<void> {
  await Promise.allSettled([...changeHandlers].map((h) => h(event)));
}

/* ── Service Input Types ─────────────────────────────────────────────────── */

export interface ScheduleSlotInput {
  timeOfDay: string;
  daysOfWeek: number[];
  dosageAmount?: number | null;
  instructionOverride?: string | null;
  enabled?: boolean;
}

export interface CreateMedicationInput {
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  instructions?: string | null;
  notes?: string | null;
  status?: MedicationStatus;
  startDate: string;
  endDate?: string | null;
  color?: string;
  remindersEnabled?: boolean;
  reminderBeforeMinutes?: number;
  slots?: ScheduleSlotInput[];
}

export interface UpdateMedicationInput {
  id: string;
  name?: string;
  dosageAmount?: number;
  dosageUnit?: string;
  instructions?: string | null;
  notes?: string | null;
  status?: MedicationStatus;
  startDate?: string;
  endDate?: string | null;
  color?: string;
  remindersEnabled?: boolean;
  reminderBeforeMinutes?: number;
  slots?: ScheduleSlotInput[];
}

/* ── Transaction Helper ──────────────────────────────────────────────────── */

async function withTx<T>(db: Db | DbTx, action: (tx: DbTx) => Promise<T>): Promise<T> {
  if ("transaction" in db && typeof db.transaction === "function") {
    return db.transaction(action);
  }
  return action(db as DbTx);
}

/* ── Service Procedures ──────────────────────────────────────────────────── */

/**
 * List all medications for a user. Excludes archived items unless `includeArchived: true`.
 */
export async function listMedications(
  db: Db | DbTx,
  userId: string,
  filter?: repo.ListMedicationsFilter,
): Promise<MedicationDTO[]> {
  const records = await repo.listMedications(db, userId, filter);
  return records.map((r) => toMedicationDTO(r.medication, r.slots));
}

/**
 * Get a specific medication by ID, checking user ownership.
 * Throws NOT_FOUND if medication does not exist or belongs to another user.
 */
export async function getMedication(
  db: Db | DbTx,
  userId: string,
  id: string,
): Promise<MedicationDTO> {
  const record = await repo.getMedicationById(db, userId, id);
  if (!record) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }
  return toMedicationDTO(record.medication, record.slots);
}

/**
 * Create a new medication with schedule slots.
 * - Prevents duplicate active medication names.
 * - Defaults to 1 slot at 08:00 daily if slots are empty.
 * - Synchronizes within a database transaction.
 * - Triggers change handlers for Phase 12 background dose generation.
 */
export async function createMedication(
  db: Db | DbTx,
  userId: string,
  input: CreateMedicationInput,
): Promise<MedicationDTO> {
  const trimmedName = input.name.trim();

  // 1. Pre-check duplicate active medication
  const existingActive = await repo.findActiveByName(db, userId, trimmedName);
  if (existingActive) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An active medication with this name already exists.",
    });
  }

  // 2. Prepare default schedule slot if omitted or empty (§10.1)
  const rawSlots: ScheduleSlotInput[] =
    input.slots && input.slots.length > 0
      ? input.slots
      : [
          {
            timeOfDay: "08:00",
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            enabled: true,
          },
        ];

  const medId = uuidv7();

  const { medication, slots } = await withTx(db, async (tx) => {
    const medRecord = await repo.insertMedication(tx, {
      id: medId,
      userId,
      name: trimmedName,
      dosageAmount: String(input.dosageAmount),
      dosageUnit: input.dosageUnit.trim(),
      instructions: input.instructions?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status ?? "active",
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      color: input.color ?? DEFAULT_MED_COLOR,
      remindersEnabled: input.remindersEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const slotInserts = rawSlots.map((slot) => ({
      id: uuidv7(),
      medicationId: medId,
      timeOfDay: slot.timeOfDay,
      daysOfWeek: slot.daysOfWeek,
      dosageAmount: slot.dosageAmount != null ? String(slot.dosageAmount) : null,
      instructionOverride: slot.instructionOverride?.trim() || null,
      enabled: slot.enabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const slotRecords = await repo.insertScheduleSlots(tx, slotInserts);
    return { medication: medRecord, slots: slotRecords };
  });

  await notifyMedicationChanged({
    userId,
    medicationId: medId,
    type: "created",
  });

  return toMedicationDTO(medication, slots);
}

/**
 * Update an existing medication and optionally replace its schedule slots.
 * - Enforces user ownership.
 * - Prevents duplicate active medication names if name is changed.
 * - If slots are provided, transactionally replaces all existing slots.
 */
export async function updateMedication(
  db: Db | DbTx,
  userId: string,
  input: UpdateMedicationInput,
): Promise<MedicationDTO> {
  const existing = await repo.getMedicationById(db, userId, input.id);
  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  // Check duplicate active name if updating name
  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    const conflict = await repo.findActiveByName(db, userId, trimmedName, input.id);
    if (conflict) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An active medication with this name already exists.",
      });
    }
  }

  const { medication, slots } = await withTx(db, async (tx) => {
    const updateValues: Record<string, unknown> = {};
    if (input.name !== undefined) updateValues.name = input.name.trim();
    if (input.dosageAmount !== undefined) updateValues.dosageAmount = String(input.dosageAmount);
    if (input.dosageUnit !== undefined) updateValues.dosageUnit = input.dosageUnit.trim();
    if (input.instructions !== undefined) updateValues.instructions = input.instructions?.trim() || null;
    if (input.notes !== undefined) updateValues.notes = input.notes?.trim() || null;
    if (input.status !== undefined) updateValues.status = input.status;
    if (input.startDate !== undefined) updateValues.startDate = input.startDate;
    if (input.endDate !== undefined) updateValues.endDate = input.endDate ?? null;
    if (input.color !== undefined) updateValues.color = input.color;
    if (input.remindersEnabled !== undefined) updateValues.remindersEnabled = input.remindersEnabled;

    let updatedMed = existing.medication;
    if (Object.keys(updateValues).length > 0) {
      const res = await repo.updateMedicationRecord(tx, userId, input.id, updateValues);
      if (res) updatedMed = res;
    }

    let updatedSlots = existing.slots;
    if (input.slots !== undefined) {
      await repo.deleteScheduleSlots(tx, input.id);

      const slotInserts = input.slots.map((slot) => ({
        id: uuidv7(),
        medicationId: input.id,
        timeOfDay: slot.timeOfDay,
        daysOfWeek: slot.daysOfWeek,
        dosageAmount: slot.dosageAmount != null ? String(slot.dosageAmount) : null,
        instructionOverride: slot.instructionOverride?.trim() || null,
        enabled: slot.enabled ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      updatedSlots = await repo.insertScheduleSlots(tx, slotInserts);
    }

    return { medication: updatedMed, slots: updatedSlots };
  });

  await notifyMedicationChanged({
    userId,
    medicationId: input.id,
    type: "updated",
  });

  return toMedicationDTO(medication, slots);
}

/**
 * Set medication status ("active" | "paused").
 */
export async function setMedicationStatus(
  db: Db | DbTx,
  userId: string,
  id: string,
  status: MedicationStatus,
): Promise<MedicationDTO> {
  const existing = await repo.getMedicationById(db, userId, id);
  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  const updatedMed = await repo.setStatusRecord(db, userId, id, status);
  if (!updatedMed) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  await notifyMedicationChanged({
    userId,
    medicationId: id,
    type: "status_changed",
  });

  return toMedicationDTO(updatedMed, existing.slots);
}

/**
 * Archive a medication (soft-delete).
 * Preserves all historical records; sets archivedAt = now() and status = "paused".
 */
export async function archiveMedication(
  db: Db | DbTx,
  userId: string,
  id: string,
): Promise<MedicationDTO> {
  const existing = await repo.getMedicationById(db, userId, id);
  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  const updatedMed = await repo.archiveMedicationRecord(db, userId, id);
  if (!updatedMed) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  await notifyMedicationChanged({
    userId,
    medicationId: id,
    type: "archived",
  });

  return toMedicationDTO(updatedMed, existing.slots);
}

/**
 * Unarchive a medication.
 * Verifies no active medication already uses the same name.
 * Sets archivedAt = null and status = "active".
 */
export async function unarchiveMedication(
  db: Db | DbTx,
  userId: string,
  id: string,
): Promise<MedicationDTO> {
  const existing = await repo.getMedicationById(db, userId, id);
  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  // Pre-check duplicate active name
  const conflict = await repo.findActiveByName(db, userId, existing.medication.name, id);
  if (conflict) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An active medication with this name already exists.",
    });
  }

  const updatedMed = await repo.unarchiveMedicationRecord(db, userId, id);
  if (!updatedMed) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Medication not found.",
    });
  }

  await notifyMedicationChanged({
    userId,
    medicationId: id,
    type: "unarchived",
  });

  return toMedicationDTO(updatedMed, existing.slots);
}
