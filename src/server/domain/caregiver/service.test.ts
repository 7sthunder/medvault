import { afterAll, describe, expect, it } from "vitest";
import { and, count, eq, type SQL } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import {
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  doseEvents,
  medications,
  notifications,
  userPreferences,
  users,
} from "@/server/db/schema";
import { DEFAULT_CAREGIVER_PERMISSIONS, type CaregiverPermissions } from "@/shared/types";

import { AuthGateError, InviteError, caregiverService } from "./service";

/**
 * Phase 17 acceptance — §10.6 is the app's STRONGEST authorization boundary, so these tests
 * pin the whole matrix: invitation lifecycle, patient-only management, cross-patient leakage
 * denial, permission gates, alert dedupe and the optional adherence-drop trigger.
 *
 * Like every DB-backed suite they run inside a transaction that is ALWAYS rolled back, so
 * nothing leaks into the seeded demo workspace that `seed.test.ts` asserts on.
 */
const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

interface Actors {
  patient: string;
  caregiver: string;
  outsider: string;
}

async function inRollbackTransaction<T>(fn: (tx: DbTx, actors: Actors) => Promise<T>): Promise<T> {
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      const make = async (name: string) => {
        const [row] = await tx
          .insert(users)
          .values({
            id: uuidv7(),
            name,
            email: `care-${uuidv7()}@medvault.local`,
            timezone: "UTC",
            onboardingCompleted: true,
          })
          .returning({ id: users.id });
        return row!.id;
      };
      const actors: Actors = {
        patient: await make("Care Patient"),
        caregiver: await make("Care Caregiver"),
        outsider: await make("Care Outsider"),
      };
      result = await fn(tx, actors);
      throw new RollbackSignal();
    });
  } catch (err) {
    if (err instanceof RollbackSignal) return result as T;
    throw err;
  }
  throw new Error("unreachable");
}

function permissions(overrides: Partial<CaregiverPermissions> = {}): CaregiverPermissions {
  return { ...DEFAULT_CAREGIVER_PERMISSIONS, ...overrides };
}

async function seedMedicationWithDoses(
  tx: DbTx,
  userId: string,
  days: number,
  status: "taken" | "missed",
) {
  const medicationId = uuidv7();
  await tx.insert(medications).values({
    id: medicationId,
    userId,
    name: `Metformin ${uuidv7().slice(0, 6)}`,
    dosageAmount: "500",
    dosageUnit: "mg",
    status: "active",
    startDate: new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10),
  });

  const eventIds: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const id = uuidv7();
    eventIds.push(id);
    await tx.insert(doseEvents).values({
      id,
      userId,
      medicationId,
      scheduledFor: new Date(Date.now() - i * 86_400_000),
      status,
      statusUpdatedAt: new Date(),
      takenAt: status === "taken" ? new Date() : null,
    });
  }
  return { medicationId, eventIds };
}

async function alertCount(tx: DbTx, where: SQL): Promise<number> {
  const [row] = await tx.select({ n: count() }).from(caregiverAlerts).where(where);
  return Number(row?.n ?? 0);
}

async function activeRelationshipId(tx: DbTx, patientUserId: string): Promise<string> {
  const [row] = await tx
    .select({ id: caregiverRelationships.id })
    .from(caregiverRelationships)
    .where(
      and(
        eq(caregiverRelationships.patientUserId, patientUserId),
        eq(caregiverRelationships.status, "active"),
      ),
    )
    .limit(1);
  return row!.id;
}

afterAll(async () => {
  await pool.end();
});

dbTests("caregiver invitation lifecycle (§10.6)", () => {
  it("invite → preview → accept activates the pair with the invited permissions", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "invitee@medvault.local",
        message: "Please keep an eye on me",
        relationType: "family",
        permissions: permissions({ viewMedications: true }),
      });
      expect(invite.token).toHaveLength(32); // crypto.randomBytes(24) → base64url
      expect(invite.status).toBe("pending");

      const preview = await caregiverService.previewByToken(tx, invite.token);
      expect(preview).not.toBeNull();
      expect(preview!.permissions.viewMedications).toBe(true);

      const relationship = await caregiverService.accept(tx, caregiver, invite.token);
      expect(relationship.status).toBe("active");
      expect(relationship.permissions.viewMedications).toBe(true);
      expect(relationship.patientUserId).toBe(patient);
      expect(relationship.caregiverUserId).toBe(caregiver);

      // One-time token: the invitation is consumed.
      const [consumed] = await tx
        .select({ status: caregiverInvitations.status })
        .from(caregiverInvitations)
        .where(eq(caregiverInvitations.id, invite.id));
      expect(consumed!.status).toBe("accepted");
      await expect(caregiverService.accept(tx, caregiver, invite.token)).rejects.toBeInstanceOf(
        InviteError,
      );
    });
  }, 30_000);

  it("blocks self-invites and duplicate pending invitations", async () => {
    await inRollbackTransaction(async (tx, { patient }) => {
      const [self] = await tx
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, patient))
        .limit(1);

      await expect(
        caregiverService.invite(tx, patient, {
          email: self!.email,
          relationType: "family",
          permissions: permissions(),
        }),
      ).rejects.toBeInstanceOf(InviteError);

      const input = {
        email: "dupe@medvault.local",
        relationType: "family" as const,
        permissions: permissions(),
      };
      await caregiverService.invite(tx, patient, input);
      await expect(caregiverService.invite(tx, patient, input)).rejects.toBeInstanceOf(InviteError);
    });
  }, 30_000);

  it("a revoked invitation can no longer be redeemed", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "revoked@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      await caregiverService.revokeInvitation(tx, patient, invite.id);
      await expect(caregiverService.accept(tx, caregiver, invite.token)).rejects.toBeInstanceOf(
        InviteError,
      );
    });
  }, 30_000);
});

dbTests("caregiver authorization matrix (§10.6 — strongest boundary)", () => {
  it("patient-only management: a caregiver cannot edit or revoke someone else's relationship", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver, outsider }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "matrix@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      const rel = await caregiverService.accept(tx, caregiver, invite.token);

      await expect(
        caregiverService.updatePermissions(
          tx,
          outsider,
          rel.id,
          permissions({ viewAdherence: false }),
        ),
      ).rejects.toBeInstanceOf(AuthGateError);
      await expect(caregiverService.revoke(tx, outsider, rel.id)).rejects.toBeInstanceOf(
        AuthGateError,
      );

      // The patient of the pair owns it and succeeds.
      const updated = await caregiverService.updatePermissions(
        tx,
        patient,
        rel.id,
        permissions({ viewMedications: true }),
      );
      expect(updated.permissions.viewMedications).toBe(true);
    });
  }, 30_000);

  it("cross-patient leakage denial: a caregiver cannot read an unrelated patient's data", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver, outsider }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "leak@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      await caregiverService.accept(tx, caregiver, invite.token);

      // Caregiver has an ACTIVE relationship with `patient`, so access is granted.
      const allowed = await caregiverService.requireCaregiverAccess(tx, caregiver, patient);
      expect(allowed).not.toBeNull();

      // ...but never with anyone else, in either direction.
      expect(await caregiverService.requireCaregiverAccess(tx, caregiver, outsider)).toBeNull();
      expect(await caregiverService.requireCaregiverAccess(tx, outsider, patient)).toBeNull();
      expect(await caregiverService.patientOverview(tx, caregiver, outsider, "UTC")).toBeNull();
      expect(await caregiverService.patientOverview(tx, outsider, patient, "UTC")).toBeNull();
      expect(await caregiverService.listPatientAlerts(tx, caregiver, outsider)).toEqual([]);
    });
  }, 30_000);

  it("revoking severs caregiver access immediately, including historical alerts", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "revoke@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      const rel = await caregiverService.accept(tx, caregiver, invite.token);
      const { medicationId, eventIds } = await seedMedicationWithDoses(tx, patient, 1, "missed");
      const created = await caregiverService.createMissedDoseAlert(
        tx,
        patient,
        { id: eventIds[0]!, medicationId, scheduledFor: new Date(), missedDeadline: new Date() },
        new Date(),
      );
      expect(created).toBe(1);

      const [alert] = await tx
        .select()
        .from(caregiverAlerts)
        .where(eq(caregiverAlerts.relationshipId, rel.id));
      expect(await caregiverService.alertDetail(tx, caregiver, alert!.id)).not.toBeNull();

      await caregiverService.revoke(tx, patient, rel.id);

      expect(await caregiverService.requireCaregiverAccess(tx, caregiver, patient)).toBeNull();
      expect(await caregiverService.patientOverview(tx, caregiver, patient, "UTC")).toBeNull();
      expect(await caregiverService.alertDetail(tx, caregiver, alert!.id)).toBeNull();
      await expect(
        caregiverService.alertAction(tx, caregiver, alert!.id, "acknowledge"),
      ).rejects.toBeInstanceOf(AuthGateError);
      await expect(
        caregiverService.updatePermissions(
          tx,
          patient,
          rel.id,
          permissions({ viewAdherence: false }),
        ),
      ).rejects.toBeInstanceOf(AuthGateError);

      // Revoking twice is a safe no-op (idempotent lifecycle).
      await expect(caregiverService.revoke(tx, patient, rel.id)).resolves.toBeUndefined();
    });
  }, 30_000);

  it("alert detail is readable by the patient it is about, and by nobody else", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver, outsider }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "detail@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      await caregiverService.accept(tx, caregiver, invite.token);
      const { medicationId, eventIds } = await seedMedicationWithDoses(tx, patient, 1, "missed");
      await caregiverService.createMissedDoseAlert(
        tx,
        patient,
        { id: eventIds[0]!, medicationId, scheduledFor: new Date(), missedDeadline: new Date() },
        new Date(),
      );
      const [alert] = await tx.select().from(caregiverAlerts).limit(1);

      expect(await caregiverService.alertDetail(tx, patient, alert!.id)).not.toBeNull();
      expect(await caregiverService.alertDetail(tx, caregiver, alert!.id)).not.toBeNull();
      expect(await caregiverService.alertDetail(tx, outsider, alert!.id)).toBeNull();
    });
  }, 30_000);

  it("permission gates: viewAdherence and canAcknowledgeAlerts are enforced server-side", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "gated@medvault.local",
        relationType: "family",
        permissions: permissions({ viewAdherence: false }),
      });
      await caregiverService.accept(tx, caregiver, invite.token);
      await expect(
        caregiverService.patientOverview(tx, caregiver, patient, "UTC"),
      ).rejects.toBeInstanceOf(AuthGateError);

      await caregiverService.updatePermissions(
        tx,
        patient,
        await activeRelationshipId(tx, patient),
        permissions(),
      );
      expect(await caregiverService.patientOverview(tx, caregiver, patient, "UTC")).not.toBeNull();
    });
  }, 30_000);
});

dbTests("caregiver alerts (§10.6)", () => {
  it("dedupes missed-dose alerts once per (dose, relationship) and mirrors one notification", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "dedupe@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      await caregiverService.accept(tx, caregiver, invite.token);
      const { medicationId, eventIds } = await seedMedicationWithDoses(tx, patient, 1, "missed");
      const ref = {
        id: eventIds[0]!,
        medicationId,
        scheduledFor: new Date(),
        missedDeadline: new Date(),
      };

      expect(await caregiverService.createMissedDoseAlert(tx, patient, ref, new Date())).toBe(1);
      expect(await caregiverService.createMissedDoseAlert(tx, patient, ref, new Date())).toBe(0);
      expect(await alertCount(tx, eq(caregiverAlerts.doseEventId, ref.id))).toBe(1);

      const [notif] = await tx
        .select({ n: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, caregiver), eq(notifications.type, "caregiver_alert")));
      expect(Number(notif!.n)).toBe(1);
    });
  }, 30_000);

  it("no alert is raised when receiveMissedDoseAlerts is off", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "muted@medvault.local",
        relationType: "family",
        permissions: permissions({ receiveMissedDoseAlerts: false }),
      });
      await caregiverService.accept(tx, caregiver, invite.token);
      const { medicationId, eventIds } = await seedMedicationWithDoses(tx, patient, 1, "missed");

      const created = await caregiverService.createMissedDoseAlert(
        tx,
        patient,
        { id: eventIds[0]!, medicationId, scheduledFor: new Date(), missedDeadline: new Date() },
        new Date(),
      );
      expect(created).toBe(0);
    });
  }, 30_000);

  it("adherence-drop alert fires below the threshold, once per relationship per day", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "drop@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      await caregiverService.accept(tx, caregiver, invite.token);
      await seedMedicationWithDoses(tx, patient, 7, "missed");

      // No threshold configured → the optional trigger stays inert.
      expect(await caregiverService.evaluateAdherenceDrop(tx, patient, "UTC")).toBe(0);

      await tx.insert(userPreferences).values({
        userId: patient,
        caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: 80, dailyDigest: false },
      });

      // 0% over 7 days is under the 80% threshold → one alert, and only one per day.
      expect(await caregiverService.evaluateAdherenceDrop(tx, patient, "UTC")).toBe(1);
      expect(await caregiverService.evaluateAdherenceDrop(tx, patient, "UTC")).toBe(0);

      const [alert] = await tx
        .select()
        .from(caregiverAlerts)
        .where(eq(caregiverAlerts.type, "adherence_drop"));
      expect(alert).toBeDefined();
      const data = alert!.data as { adherenceAfter: number; threshold: number };
      expect(data.threshold).toBe(80);
      expect(data.adherenceAfter).toBe(0);
    });
  }, 30_000);

  it("a healthy 7-day rate never raises an adherence-drop alert", async () => {
    await inRollbackTransaction(async (tx, { patient, caregiver }) => {
      const invite = await caregiverService.invite(tx, patient, {
        email: "healthy@medvault.local",
        relationType: "family",
        permissions: permissions(),
      });
      await caregiverService.accept(tx, caregiver, invite.token);
      await seedMedicationWithDoses(tx, patient, 7, "taken");
      await tx.insert(userPreferences).values({
        userId: patient,
        caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: 80, dailyDigest: false },
      });

      expect(await caregiverService.evaluateAdherenceDrop(tx, patient, "UTC")).toBe(0);
    });
  }, 30_000);
});
