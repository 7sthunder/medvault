import { and, asc, desc, eq, isNull, not, inArray } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { medications, medicationSchedules } from "@/server/db/schema";
import type { MedicationStatus } from "@/shared/enums";

type MedRow = typeof medications.$inferSelect;
type SlotRow = typeof medicationSchedules.$inferSelect;
type MedInsert = typeof medications.$inferInsert;
type SlotInsert = typeof medicationSchedules.$inferInsert;

/** All non-archived medications for a user, name-sorted (the default list). */
export async function listActiveMedications(db: Db | DbTx, userId: string): Promise<MedRow[]> {
  return db
    .select()
    .from(medications)
    .where(and(eq(medications.userId, userId), isNull(medications.archivedAt)))
    .orderBy(asc(medications.name));
}

/** Archived (soft-deleted) medications for the "history" bucket (§10.1). */
export async function listArchivedMedications(db: Db | DbTx, userId: string): Promise<MedRow[]> {
  return db
    .select()
    .from(medications)
    .where(and(eq(medications.userId, userId), not(isNull(medications.archivedAt))))
    .orderBy(desc(medications.archivedAt));
}

/** All schedule slots for the given medication ids (bulk join). */
export async function listSlotsByMedicationIds(db: Db | DbTx, medicationIds: string[]): Promise<SlotRow[]> {
  if (medicationIds.length === 0) return [];
  return db
    .select()
    .from(medicationSchedules)
    .where(inArray(medicationSchedules.medicationId, medicationIds))
    .orderBy(asc(medicationSchedules.timeOfDay));
}

/** A medication row (incl. archived) scoped to the owner, or undefined. */
export async function getMedicationById(
  db: Db | DbTx,
  userId: string,
  medicationId: string,
): Promise<MedRow | undefined> {
  const [row] = await db
    .select()
    .from(medications)
    .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)));
  return row;
}

/**
 * Partial-unique guard: any non-archived medication with the same name already exists.
 * `excludeId` lets update() ignore the row being edited.
 */
export async function findActiveByName(
  db: Db | DbTx,
  userId: string,
  name: string,
  excludeId?: string,
): Promise<MedRow | undefined> {
  const conditions = [
    eq(medications.userId, userId),
    eq(medications.name, name),
    isNull(medications.archivedAt),
  ];
  if (excludeId) conditions.push(not(eq(medications.id, excludeId)));
  const [row] = await db.select().from(medications).where(and(...conditions)).limit(1);
  return row;
}

/** Insert a medication master row; returns its id. */
export async function insertMedication(db: Db | DbTx, values: Omit<MedInsert, "id"> & { id?: string }): Promise<string> {
  const id = values.id ?? uuidv7();
  const [row] = await db
    .insert(medications)
    .values({ ...values, id, updatedAt: new Date() })
    .returning({ id: medications.id });
  return row!.id;
}

/** Replace a medication's schedule (delete + insert, single-owner scope). */
export async function replaceSlots(db: Db | DbTx, medicationId: string, slots: SlotInsert[]): Promise<void> {
  await db.delete(medicationSchedules).where(eq(medicationSchedules.medicationId, medicationId));
  if (slots.length > 0) {
    await db.insert(medicationSchedules).values(slots);
  }
}

/** Update mutable master fields; returns the updated row (undefined if not owned). */
export async function updateMedication(
  db: Db | DbTx,
  userId: string,
  medicationId: string,
  values: Partial<Pick<MedInsert, "name" | "dosageAmount" | "dosageUnit" | "instructions" | "notes" | "startDate" | "endDate" | "color" | "remindersEnabled">>,
): Promise<MedRow | undefined> {
  const [row] = await db
    .update(medications)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
    .returning();
  return row;
}

/** Set lifecycle status (active ↔ paused). Owner-scoped. */
export async function setMedicationStatus(
  db: Db | DbTx,
  userId: string,
  medicationId: string,
  status: MedicationStatus,
): Promise<MedRow | undefined> {
  const [row] = await db
    .update(medications)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
    .returning();
  return row;
}

/** Soft delete (§8.3): archivedAt=now + status paused; keeps all history rows. */
export async function archiveMedication(
  db: Db | DbTx,
  userId: string,
  medicationId: string,
): Promise<MedRow | undefined> {
  const [row] = await db
    .update(medications)
    .set({ archivedAt: new Date(), status: "paused", updatedAt: new Date() })
    .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
    .returning();
  return row;
}

