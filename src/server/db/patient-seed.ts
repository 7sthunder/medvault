import { eq } from "drizzle-orm";
import type { Db, DbTx } from "./helpers";
import { addDays, atTime, utcDateKey, uuidv7 } from "./helpers";
import {
  adherenceDaily,
  appointments,
  caregiverAlerts,
  doseActions,
  doseEvents,
  medications,
  medicationSchedules,
  users,
} from "./schema";

const ALICE_MEDS = [
  { name: "Metformin", dosageAmount: "500", dosageUnit: "mg", color: "#10b981", times: [8, 20] },
  { name: "Lisinopril", dosageAmount: "10", dosageUnit: "mg", color: "#06b6d4", times: [9] },
  { name: "Atorvastatin", dosageAmount: "20", dosageUnit: "mg", color: "#8b5cf6", times: [21] },
  { name: "Vitamin D3", dosageAmount: "2000", dosageUnit: "IU", color: "#f59e0b", times: [12] },
] as const;

const BOB_MEDS = [
  { name: "Amlodipine", dosageAmount: "5", dosageUnit: "mg", color: "#3b82f6", times: [8] },
  { name: "Omeprazole", dosageAmount: "20", dosageUnit: "mg", color: "#f472b6", times: [7] },
] as const;

/**
 * Seeds clinical records (medications, schedules, dose events, appointments, alerts)
 * for dev patients Alice Hartono and Bob Mensah so they sync seamlessly in the Caregiver Portal.
 * Idempotent: wipes patient-owned records before inserting deterministic rows.
 */
export async function seedDevPatients(db: Db | DbTx): Promise<{
  aliceEvents: number;
  bobEvents: number;
}> {
  const [alice] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "alice@medvault.local"))
    .limit(1);

  const [bob] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "bob@medvault.local"))
    .limit(1);

  if (!alice || !bob) {
    return { aliceEvents: 0, bobEvents: 0 };
  }

  // --- Alice Hartono (4 Active Meds, 14 days of doses, 95.7% adherence) ---
  await db.delete(caregiverAlerts).where(eq(caregiverAlerts.patientUserId, alice.id));
  await db.delete(doseActions).where(eq(doseActions.userId, alice.id));
  await db.delete(adherenceDaily).where(eq(adherenceDaily.userId, alice.id));
  await db.delete(appointments).where(eq(appointments.patientUserId, alice.id));
  await db.delete(medications).where(eq(medications.userId, alice.id));

  const now = new Date();
  const aliceStart = addDays(now, -13);
  const aliceMeds = ALICE_MEDS.map((m) => ({
    id: uuidv7(),
    userId: alice.id,
    name: m.name,
    dosageAmount: m.dosageAmount,
    dosageUnit: m.dosageUnit,
    color: m.color,
    status: "active" as const,
    startDate: utcDateKey(aliceStart),
  }));
  await db.insert(medications).values(aliceMeds);

  const aliceSlots: (typeof medicationSchedules.$inferInsert)[] = [];
  aliceMeds.forEach((m, idx) => {
    ALICE_MEDS[idx]!.times.forEach((hour) => {
      aliceSlots.push({
        id: uuidv7(),
        medicationId: m.id,
        timeOfDay: `${String(hour).padStart(2, "0")}:00`,
      });
    });
  });
  await db.insert(medicationSchedules).values(aliceSlots);

  const aliceEvents: (typeof doseEvents.$inferInsert)[] = [];
  const aliceDaily: Record<string, { scheduled: number; taken: number; missed: number; skipped: number; snoozed: number }> = {};

  for (let i = 0; i < 14; i++) {
    const day = addDays(aliceStart, i);
    const dateKey = utcDateKey(day);
    const bucket = (aliceDaily[dateKey] ??= { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 });

    for (const [medIdx, med] of ALICE_MEDS.entries()) {
      for (const hour of med.times) {
        const scheduledFor = atTime(day, hour, 0);
        const medRow = aliceMeds[medIdx]!;
        const slot = aliceSlots.find((s) => s.medicationId === medRow.id && s.timeOfDay === `${String(hour).padStart(2, "0")}:00`)!;
        const eventId = uuidv7();

        const isMissed =
          (med.name === "Metformin" && hour === 20 && i === 2) ||
          (med.name === "Lisinopril" && i === 4) ||
          (med.name === "Atorvastatin" && i === 6);

        const status = isMissed ? "missed" : "taken";
        bucket.scheduled += 1;
        if (status === "taken") {
          bucket.taken += 1;
        } else {
          bucket.missed += 1;
        }

        aliceEvents.push({
          id: eventId,
          userId: alice.id,
          medicationId: medRow.id,
          scheduleId: slot.id,
          scheduledFor,
          status,
          takenAt: status === "taken" ? new Date(scheduledFor.getTime() + 10 * 60_000) : null,
          missedDeadline: status === "missed" ? new Date(scheduledFor.getTime() + 30 * 60_000) : null,
          source: "demo",
          statusUpdatedAt: scheduledFor,
        });
      }
    }
  }
  await db.insert(doseEvents).values(aliceEvents);

  const aliceAdherenceRows = Object.entries(aliceDaily).map(([date, d], i) => {
    const attended = d.taken + d.missed + d.skipped;
    const percent = attended > 0 ? ((d.taken / attended) * 100).toFixed(2) : "0.00";
    return {
      id: uuidv7(),
      userId: alice.id,
      date,
      scheduled: d.scheduled,
      taken: d.taken,
      missed: d.missed,
      skipped: d.skipped,
      snoozed: d.snoozed,
      adherencePercent: percent,
      streakDay: i >= 7 && d.missed === 0,
    };
  });
  await db.insert(adherenceDaily).values(aliceAdherenceRows);

  await db.insert(appointments).values([
    {
      id: uuidv7(),
      patientUserId: alice.id,
      createdByUserId: alice.id,
      doctorName: "Dr. Priya Patel",
      specialty: "Cardiology",
      clinicName: "Metro Heart Institute",
      appointmentDate: addDays(new Date(), 1),
      notes: "Routine blood pressure check and cardiovascular review.",
      status: "scheduled",
      reminderEnabled: true,
    },
    {
      id: uuidv7(),
      patientUserId: alice.id,
      createdByUserId: alice.id,
      doctorName: "Dr. Ramesh Nair",
      specialty: "Endocrinology",
      clinicName: "Apollo Health City",
      appointmentDate: addDays(new Date(), 4),
      notes: "HbA1c quarterly diabetes assessment and Metformin review.",
      status: "scheduled",
      reminderEnabled: true,
    },
  ]);

  // --- Bob Mensah (2 Active Meds, 10 days of doses, 90.0% adherence) ---
  await db.delete(caregiverAlerts).where(eq(caregiverAlerts.patientUserId, bob.id));
  await db.delete(doseActions).where(eq(doseActions.userId, bob.id));
  await db.delete(adherenceDaily).where(eq(adherenceDaily.userId, bob.id));
  await db.delete(appointments).where(eq(appointments.patientUserId, bob.id));
  await db.delete(medications).where(eq(medications.userId, bob.id));

  const bobStart = addDays(now, -9);
  const bobMeds = BOB_MEDS.map((m) => ({
    id: uuidv7(),
    userId: bob.id,
    name: m.name,
    dosageAmount: m.dosageAmount,
    dosageUnit: m.dosageUnit,
    color: m.color,
    status: "active" as const,
    startDate: utcDateKey(bobStart),
  }));
  await db.insert(medications).values(bobMeds);

  const bobSlots: (typeof medicationSchedules.$inferInsert)[] = [];
  bobMeds.forEach((m, idx) => {
    BOB_MEDS[idx]!.times.forEach((hour) => {
      bobSlots.push({
        id: uuidv7(),
        medicationId: m.id,
        timeOfDay: `${String(hour).padStart(2, "0")}:00`,
      });
    });
  });
  await db.insert(medicationSchedules).values(bobSlots);

  const bobEvents: (typeof doseEvents.$inferInsert)[] = [];
  const bobDaily: Record<string, { scheduled: number; taken: number; missed: number; skipped: number; snoozed: number }> = {};

  for (let i = 0; i < 10; i++) {
    const day = addDays(bobStart, i);
    const dateKey = utcDateKey(day);
    const bucket = (bobDaily[dateKey] ??= { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0 });

    for (const [medIdx, med] of BOB_MEDS.entries()) {
      for (const hour of med.times) {
        const scheduledFor = atTime(day, hour, 0);
        const medRow = bobMeds[medIdx]!;
        const slot = bobSlots.find((s) => s.medicationId === medRow.id && s.timeOfDay === `${String(hour).padStart(2, "0")}:00`)!;
        const eventId = uuidv7();

        const isMissed = med.name === "Amlodipine" && (i === 1 || i === 3);
        const status = isMissed ? "missed" : "taken";
        bucket.scheduled += 1;
        if (status === "taken") bucket.taken += 1;
        else bucket.missed += 1;

        bobEvents.push({
          id: eventId,
          userId: bob.id,
          medicationId: medRow.id,
          scheduleId: slot.id,
          scheduledFor,
          status,
          takenAt: status === "taken" ? new Date(scheduledFor.getTime() + 10 * 60_000) : null,
          missedDeadline: status === "missed" ? new Date(scheduledFor.getTime() + 30 * 60_000) : null,
          source: "demo",
          statusUpdatedAt: scheduledFor,
        });
      }
    }
  }
  await db.insert(doseEvents).values(bobEvents);

  const bobAdherenceRows = Object.entries(bobDaily).map(([date, d], i) => {
    const attended = d.taken + d.missed + d.skipped;
    const percent = attended > 0 ? ((d.taken / attended) * 100).toFixed(2) : "0.00";
    return {
      id: uuidv7(),
      userId: bob.id,
      date,
      scheduled: d.scheduled,
      taken: d.taken,
      missed: d.missed,
      skipped: d.skipped,
      snoozed: d.snoozed,
      adherencePercent: percent,
      streakDay: i >= 4 && d.missed === 0,
    };
  });
  await db.insert(adherenceDaily).values(bobAdherenceRows);

  await db.insert(appointments).values([
    {
      id: uuidv7(),
      patientUserId: bob.id,
      createdByUserId: bob.id,
      doctorName: "Dr. Sarah Jenkins",
      specialty: "General Practice",
      clinicName: "City Care Clinic",
      appointmentDate: addDays(new Date(), 3),
      notes: "Annual wellness checkup and medication refill.",
      status: "scheduled",
      reminderEnabled: true,
    },
  ]);

  return {
    aliceEvents: aliceEvents.length,
    bobEvents: bobEvents.length,
  };
}
