/**
 * Phase 11 — Medication repository (plan §10.1).
 *
 * Direct Drizzle queries for `medications` and `medication_schedules`.
 * Always scopes reads and writes by `userId` to enforce ownership.
 */

import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import {
  medications,
  medicationSchedules,
  type MedicationStatus,
} from "@/server/db/schema";
import type { MedicationRecord, ScheduleSlotRecord } from "./mapper";

export interface MedicationWithSlots {
  medication: MedicationRecord;
  slots: ScheduleSlotRecord[];
}

export interface ListMedicationsFilter {
  includeArchived?: boolean;
  status?: MedicationStatus;
}

/**
 * List all medications for a user, optionally including archived ones or filtering by status.
 * Returns each medication bundled with its schedule slots.
 */
export async function listMedications(
  db: Db | DbTx,
  userId: string,
  filter?: ListMedicationsFilter,
): Promise<MedicationWithSlots[]> {
  const conditions = [eq(medications.userId, userId)];

  if (!filter?.includeArchived) {
    conditions.push(isNull(medications.archivedAt));
  }

  if (filter?.status) {
    conditions.push(eq(medications.status, filter.status));
  }

  const medRows = await db
    .select()
    .from(medications)
    .where(and(...conditions))
    .orderBy(desc(medications.createdAt));

  if (medRows.length === 0) {
    return [];
  }

  const medIds = medRows.map((m) => m.id);
  const slotRows = await db
    .select()
    .from(medicationSchedules)
    .where(inArray(medicationSchedules.medicationId, medIds))
    .orderBy(asc(medicationSchedules.timeOfDay));

  const slotsByMedId = new Map<string, ScheduleSlotRecord[]>();
  for (const slot of slotRows) {
    const list = slotsByMedId.get(slot.medicationId) ?? [];
    list.push(slot);
    slotsByMedId.set(slot.medicationId, list);
  }

  return medRows.map((med) => ({
    medication: med,
    slots: slotsByMedId.get(med.id) ?? [],
  }));
}

/**
 * Find a specific medication by ID, strictly scoped to the owning user.
 * Returns the medication with its schedule slots, or null if not found.
 */
export async function getMedicationById(
  db: Db | DbTx,
  userId: string,
  id: string,
): Promise<MedicationWithSlots | null> {
  const medRows = await db
    .select()
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .limit(1);

  const med = medRows[0];
  if (!med) {
    return null;
  }

  const slots = await db
    .select()
    .from(medicationSchedules)
    .where(eq(medicationSchedules.medicationId, id))
    .orderBy(asc(medicationSchedules.timeOfDay));

  return { medication: med, slots };
}

/**
 * Check if an active (non-archived) medication with the given name exists for the user.
 * Case-insensitive match on trimmed name.
 * Optionally exclude a medication ID (for updates).
 */
export async function findActiveByName(
  db: Db | DbTx,
  userId: string,
  name: string,
  excludeId?: string,
): Promise<MedicationRecord | null> {
  const conditions = [
    eq(medications.userId, userId),
    isNull(medications.archivedAt),
    sql`lower(${medications.name}) = lower(${name.trim()})`,
  ];

  if (excludeId) {
    conditions.push(ne(medications.id, excludeId));
  }

  const rows = await db
    .select()
    .from(medications)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Insert a new medication row.
 */
export async function insertMedication(
  tx: DbTx,
  values: typeof medications.$inferInsert,
): Promise<MedicationRecord> {
  const [created] = await tx.insert(medications).values(values).returning();
  return created!;
}

/**
 * Bulk insert schedule slot rows.
 */
export async function insertScheduleSlots(
  tx: DbTx,
  values: (typeof medicationSchedules.$inferInsert)[],
): Promise<ScheduleSlotRecord[]> {
  if (values.length === 0) return [];
  return tx.insert(medicationSchedules).values(values).returning();
}

/**
 * Update an existing medication row scoped to userId.
 */
export async function updateMedicationRecord(
  tx: DbTx,
  userId: string,
  id: string,
  values: Partial<typeof medications.$inferInsert>,
): Promise<MedicationRecord | null> {
  const [updated] = await tx
    .update(medications)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Delete all schedule slots for a medication.
 */
export async function deleteScheduleSlots(
  tx: DbTx,
  medicationId: string,
): Promise<void> {
  await tx
    .delete(medicationSchedules)
    .where(eq(medicationSchedules.medicationId, medicationId));
}

/**
 * Archive a medication (soft-delete): sets archivedAt = now(), status = "paused".
 */
export async function archiveMedicationRecord(
  db: Db | DbTx,
  userId: string,
  id: string,
): Promise<MedicationRecord | null> {
  const [updated] = await db
    .update(medications)
    .set({
      archivedAt: new Date(),
      status: "paused",
      updatedAt: new Date(),
    })
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Unarchive a medication: clears archivedAt, sets status = "active".
 */
export async function unarchiveMedicationRecord(
  db: Db | DbTx,
  userId: string,
  id: string,
): Promise<MedicationRecord | null> {
  const [updated] = await db
    .update(medications)
    .set({
      archivedAt: null,
      status: "active",
      updatedAt: new Date(),
    })
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Set medication status ("active" | "paused").
 */
export async function setStatusRecord(
  db: Db | DbTx,
  userId: string,
  id: string,
  status: MedicationStatus,
): Promise<MedicationRecord | null> {
  const [updated] = await db
    .update(medications)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .returning();

  return updated ?? null;
}
