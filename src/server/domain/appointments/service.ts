import { and, eq, gte } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { appointments, caregiverRelationships, users } from "@/server/db/schema";
import { createNotification } from "@/server/domain/notifications/service";
import { now } from "@/shared/times";
import type { AppointmentDTO } from "@/shared/types";
import type {
  AppointmentCreateInput,
  AppointmentQueryInput,
  AppointmentUpdateInput,
} from "@/shared/validations/appointment";

/**
 * Validates that `callerUserId` is either the patient themselves or an active caregiver with access.
 */
async function assertCanAccessPatient(db: Db | DbTx, callerUserId: string, patientUserId: string) {
  if (callerUserId === patientUserId) return;

  const [rel] = await db
    .select({ status: caregiverRelationships.status })
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.caregiverUserId, callerUserId),
        eq(caregiverRelationships.patientUserId, patientUserId),
        eq(caregiverRelationships.status, "active"),
      ),
    )
    .limit(1);

  if (!rel) {
    throw new Error("You do not have active caregiver authorization for this patient.");
  }
}

export async function listAppointments(
  db: Db | DbTx,
  callerUserId: string,
  input: AppointmentQueryInput = { includePast: false },
): Promise<AppointmentDTO[]> {
  const targetPatientId = input.patientUserId ?? callerUserId;
  await assertCanAccessPatient(db, callerUserId, targetPatientId);

  const currentNow = now();
  const pastCutoff = new Date(currentNow.getTime() - 24 * 60 * 60 * 1000); // within last 24h

  const conditions = [eq(appointments.patientUserId, targetPatientId)];
  if (!input.includePast) {
    conditions.push(gte(appointments.appointmentDate, pastCutoff));
  }

  const rows = await db
    .select({
      appointment: appointments,
      patientName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientUserId))
    .where(and(...conditions))
    .orderBy(appointments.appointmentDate);

  return rows.map(({ appointment, patientName }) => ({
    id: appointment.id,
    patientUserId: appointment.patientUserId,
    createdByUserId: appointment.createdByUserId,
    doctorName: appointment.doctorName,
    specialty: appointment.specialty,
    clinicName: appointment.clinicName,
    appointmentDate: appointment.appointmentDate,
    notes: appointment.notes,
    status: appointment.status,
    reminderEnabled: appointment.reminderEnabled,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    patientName,
  }));
}

export async function createAppointment(
  db: Db | DbTx,
  callerUserId: string,
  input: AppointmentCreateInput,
): Promise<AppointmentDTO> {
  const targetPatientId = input.patientUserId ?? callerUserId;
  await assertCanAccessPatient(db, callerUserId, targetPatientId);

  const id = uuidv7();
  const currentNow = now();

  await db.insert(appointments).values({
    id,
    patientUserId: targetPatientId,
    createdByUserId: callerUserId,
    doctorName: input.doctorName.trim(),
    specialty: input.specialty?.trim() || null,
    clinicName: input.clinicName?.trim() || null,
    appointmentDate: input.appointmentDate,
    notes: input.notes?.trim() || null,
    reminderEnabled: input.reminderEnabled ?? true,
    status: "scheduled",
    createdAt: currentNow,
    updatedAt: currentNow,
  });

  const [patientUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, targetPatientId))
    .limit(1);

  if (callerUserId !== targetPatientId) {
    const [callerUser] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, callerUserId))
      .limit(1);

    await createNotification(db, {
      userId: targetPatientId,
      type: "system",
      title: "New Doctor Appointment Scheduled",
      body: `${callerUser?.name ?? "Your caregiver"} scheduled an appointment with Dr. ${input.doctorName}.`,
    }).catch(() => {});
  }

  return {
    id,
    patientUserId: targetPatientId,
    createdByUserId: callerUserId,
    doctorName: input.doctorName.trim(),
    specialty: input.specialty?.trim() || null,
    clinicName: input.clinicName?.trim() || null,
    appointmentDate: input.appointmentDate,
    notes: input.notes?.trim() || null,
    status: "scheduled",
    reminderEnabled: input.reminderEnabled ?? true,
    createdAt: currentNow,
    updatedAt: currentNow,
    patientName: patientUser?.name || "Patient",
  };
}

export async function updateAppointment(
  db: Db | DbTx,
  callerUserId: string,
  input: AppointmentUpdateInput,
): Promise<AppointmentDTO> {
  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, input.id))
    .limit(1);

  if (!existing) {
    throw new Error("Appointment not found.");
  }

  await assertCanAccessPatient(db, callerUserId, existing.patientUserId);

  const currentNow = now();
  const updateData: Partial<typeof appointments.$inferInsert> = {
    updatedAt: currentNow,
  };

  if (input.doctorName !== undefined) updateData.doctorName = input.doctorName.trim();
  if (input.specialty !== undefined) updateData.specialty = input.specialty?.trim() || null;
  if (input.clinicName !== undefined) updateData.clinicName = input.clinicName?.trim() || null;
  if (input.appointmentDate !== undefined) updateData.appointmentDate = input.appointmentDate;
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.reminderEnabled !== undefined) updateData.reminderEnabled = input.reminderEnabled;

  await db.update(appointments).set(updateData).where(eq(appointments.id, input.id));

  const [updated] = await db
    .select({
      appointment: appointments,
      patientName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientUserId))
    .where(eq(appointments.id, input.id))
    .limit(1);

  if (!updated) {
    throw new Error("Failed to load updated appointment.");
  }

  return {
    id: updated.appointment.id,
    patientUserId: updated.appointment.patientUserId,
    createdByUserId: updated.appointment.createdByUserId,
    doctorName: updated.appointment.doctorName,
    specialty: updated.appointment.specialty,
    clinicName: updated.appointment.clinicName,
    appointmentDate: updated.appointment.appointmentDate,
    notes: updated.appointment.notes,
    status: updated.appointment.status,
    reminderEnabled: updated.appointment.reminderEnabled,
    createdAt: updated.appointment.createdAt,
    updatedAt: updated.appointment.updatedAt,
    patientName: updated.patientName,
  };
}

export async function cancelAppointment(
  db: Db | DbTx,
  callerUserId: string,
  appointmentId: string,
): Promise<{ success: boolean }> {
  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!existing) {
    throw new Error("Appointment not found.");
  }

  await assertCanAccessPatient(db, callerUserId, existing.patientUserId);

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: now() })
    .where(eq(appointments.id, appointmentId));

  return { success: true };
}
