import { afterAll, describe, expect, it } from "vitest";
import { and, count, eq } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import {
  adherenceDaily,
  aiInsights,
  caregiverAlerts,
  caregiverRelationships,
  doseActions,
  doseEvents,
  medications,
  notifications,
  userPreferences,
  users,
} from "@/server/db/schema";
import { DEFAULT_CAREGIVER_PERMISSIONS } from "@/shared/types";
import {
  DELETE_ACCOUNT_CONFIRM,
  DELETE_DATA_CONFIRM,
  deleteAccountSchema,
  deleteAllDataSchema,
} from "@/shared/validations/settings";

import { SettingsError, settingsService } from "./service";

/**
 * Phase 18 acceptance — §10.11 settings domain.
 *
 * The properties that matter and are easy to regress:
 *  - **owner scoping** (one account can never read or mutate another account's rows),
 *  - **destructive ordering + account survival** (`deleteAllData` keeps the account),
 *  - **CSV integrity** (quoting, deterministic columns, correct scope),
 *  - **timezone invalidation** (a profile change drops the stale day buckets).
 */
const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

interface Actors {
  owner: string;
  stranger: string;
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
            email: `settings-${uuidv7()}@meditrackai.local`,
            timezone: "UTC",
            onboardingCompleted: true,
          })
          .returning({ id: users.id });
        return row!.id;
      };
      const actors: Actors = {
        owner: await make("Settings Owner"),
        stranger: await make("Settings Stranger"),
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

async function seedMedication(
  tx: DbTx,
  userId: string,
  overrides: Partial<typeof medications.$inferInsert> = {},
) {
  const [row] = await tx
    .insert(medications)
    .values({
      id: uuidv7(),
      userId,
      name: `Metformin ${uuidv7().slice(20, 26)}`,
      dosageAmount: "500",
      dosageUnit: "mg",
      status: "active",
      startDate: "2026-01-01",
      ...overrides,
    })
    .returning();
  return row!;
}

async function countFor(
  tx: DbTx,
  table:
    | typeof doseEvents
    | typeof doseActions
    | typeof notifications
    | typeof aiInsights
    | typeof adherenceDaily,
  userId: string,
) {
  const [row] = await tx
    .select({ n: count() })
    .from(table as typeof doseEvents)
    .where(eq((table as typeof doseEvents).userId, userId));
  return Number(row?.n ?? 0);
}

afterAll(async () => {
  await pool.end();
});

dbTests("settings profile (§10.11)", () => {
  it("reads the caller's own profile and never another account's", async () => {
    await inRollbackTransaction(async (tx, { owner, stranger }) => {
      const profile = await settingsService.getProfile(tx, owner);
      expect(profile.name).toBe("Settings Owner");
      expect(profile.isDemo).toBe(false);

      const [strangerRow] = await tx
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, stranger))
        .limit(1);
      expect(profile.name).not.toBe(strangerRow!.name);

      await expect(settingsService.getProfile(tx, "does-not-exist")).rejects.toBeInstanceOf(
        SettingsError,
      );
    });
  }, 30_000);

  it("updates name/email/timezone and rejects an email that belongs to someone else", async () => {
    await inRollbackTransaction(async (tx, { owner, stranger }) => {
      const [strangerRow] = await tx
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, stranger))
        .limit(1);

      await expect(
        settingsService.updateProfile(tx, owner, {
          name: "Owner",
          email: strangerRow!.email,
          timezone: "Asia/Kolkata",
        }),
      ).rejects.toBeInstanceOf(SettingsError);

      const updated = await settingsService.updateProfile(tx, owner, {
        name: "  Renamed Owner  ",
        email: "  Renamed@MediTrack AI.Local ",
        timezone: "Asia/Kolkata",
      });
      expect(updated.name).toBe("Renamed Owner"); // trimmed
      expect(updated.email).toBe("renamed@meditrackai.local"); // lower-cased
      expect(updated.timezone).toBe("Asia/Kolkata");

      // Re-saving the *same* email is not a conflict.
      await expect(
        settingsService.updateProfile(tx, owner, {
          name: "Renamed Owner",
          email: "renamed@meditrackai.local",
          timezone: "Asia/Kolkata",
        }),
      ).resolves.toMatchObject({ email: "renamed@meditrackai.local" });
    });
  }, 30_000);

  it("a timezone change invalidates the materialized day buckets (dose events survive)", async () => {
    await inRollbackTransaction(async (tx, { owner }) => {
      const med = await seedMedication(tx, owner);
      await tx.insert(doseEvents).values({
        id: uuidv7(),
        userId: owner,
        medicationId: med.id,
        scheduledFor: new Date("2026-03-01T08:00:00Z"),
        status: "taken",
      });
      await tx.insert(adherenceDaily).values({
        id: uuidv7(),
        userId: owner,
        date: "2026-03-01",
        medicationId: null,
        scheduled: 1,
        taken: 1,
        adherencePercent: "100.00",
      });
      expect(await countFor(tx, adherenceDaily, owner)).toBe(1);

      await settingsService.updateProfile(tx, owner, {
        name: "Settings Owner",
        email: "settings-owner@meditrackai.local",
        timezone: "Pacific/Auckland",
      });

      expect(await countFor(tx, adherenceDaily, owner)).toBe(0);
      expect(await countFor(tx, doseEvents, owner)).toBe(1); // the real data is never touched
    });
  }, 30_000);
});

dbTests("settings reminders + appearance (§10.11)", () => {
  it("creates a preferences row on first read and persists reminder defaults", async () => {
    await inRollbackTransaction(async (tx, { owner }) => {
      const before = await settingsService.getReminderSettings(tx, owner);
      expect(before.missedAfterMinutes).toBe(30); // engine default
      expect(before.medications).toEqual([]);

      const saved = await settingsService.updateReminderSettings(tx, owner, {
        missedAfterMinutes: 45,
        snoozeMinutes: 15,
        maxSnoozes: 2,
        reminderBeforeMinutes: 10,
        notificationPrefs: {
          doseReminders: false,
          caregiverMissedAlerts: true,
          insights: true,
          sounds: false,
        },
        caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: 70, dailyDigest: true },
      });
      expect(saved.missedAfterMinutes).toBe(45);

      const reread = await settingsService.getReminderSettings(tx, owner);
      expect(reread.snoozeMinutes).toBe(15);
      expect(reread.notificationPrefs.doseReminders).toBe(false);
      expect(reread.caregiverAlertPrefs.adherenceDropThreshold).toBe(70);
      expect(reread.caregiverAlertPrefs.dailyDigest).toBe(true);
    });
  }, 30_000);

  it("bulk-toggles remindersEnabled for the caller's medications only", async () => {
    await inRollbackTransaction(async (tx, { owner, stranger }) => {
      const mine = await seedMedication(tx, owner);
      const other = await seedMedication(tx, owner, { remindersEnabled: true });
      const theirs = await seedMedication(tx, stranger);

      await settingsService.setMedicationReminders(tx, owner, [mine.id, other.id], false);

      const rows = await tx
        .select({ id: medications.id, on: medications.remindersEnabled })
        .from(medications)
        .where(eq(medications.userId, owner));
      expect(rows.every((r) => r.on === false)).toBe(true);

      // A stranger's id in the list is a silent no-op, never a cross-account write.
      await settingsService.setMedicationReminders(tx, owner, [theirs.id], true);
      const [stillTheirs] = await tx
        .select({ on: medications.remindersEnabled })
        .from(medications)
        .where(eq(medications.id, theirs.id));
      expect(stillTheirs!.on).toBe(true);
    });
  }, 30_000);

  it("persists appearance and normalises a null adherence threshold", async () => {
    await inRollbackTransaction(async (tx, { owner }) => {
      expect(await settingsService.getAppearance(tx, owner)).toEqual({
        theme: "light",
        reduceMotion: false,
        uiDensity: "comfortable",
      });

      await settingsService.updateAppearance(tx, owner, {
        theme: "dark",
        reduceMotion: true,
        uiDensity: "compact",
      });
      expect(await settingsService.getAppearance(tx, owner)).toEqual({
        theme: "dark",
        reduceMotion: true,
        uiDensity: "compact",
      });

      const prefs = await settingsService.updateCaregiverPrefs(tx, owner, {
        missedDoseOn: false,
        adherenceDropThreshold: null,
        dailyDigest: false,
      });
      expect(prefs.adherenceDropThreshold).toBeNull();
      expect(prefs.missedDoseOn).toBe(false);
    });
  }, 30_000);
});

dbTests("settings data governance (§10.11)", () => {
  it("data overview counts only the caller's rows and reports the real span", async () => {
    await inRollbackTransaction(async (tx, { owner, stranger }) => {
      const med = await seedMedication(tx, owner);
      const theirMed = await seedMedication(tx, stranger);
      await tx.insert(doseEvents).values([
        {
          id: uuidv7(),
          userId: owner,
          medicationId: med.id,
          scheduledFor: new Date("2026-02-01T08:00:00Z"),
          status: "taken",
        },
        {
          id: uuidv7(),
          userId: owner,
          medicationId: med.id,
          scheduledFor: new Date("2026-02-05T08:00:00Z"),
          status: "missed",
          isDemo: true,
        },
        {
          id: uuidv7(),
          userId: stranger,
          medicationId: theirMed.id,
          scheduledFor: new Date("2026-02-09T08:00:00Z"),
          status: "taken",
        },
      ]);

      const overview = await settingsService.getDataOverview(tx, owner);
      expect(overview.medications).toBe(1);
      expect(overview.doseEvents).toBe(2); // the stranger's event is invisible
      expect(overview.firstDoseAt?.toISOString()).toBe("2026-02-01T08:00:00.000Z");
      expect(overview.lastDoseAt?.toISOString()).toBe("2026-02-05T08:00:00.000Z");
      expect(overview.hasDemoData).toBe(true);
    });
  }, 30_000);

  it("exports CSV with deterministic columns and RFC-4180 quoting", async () => {
    await inRollbackTransaction(async (tx, { owner }) => {
      const med = await seedMedication(tx, owner, { name: 'Aspirin, "low" dose' });
      await tx.insert(doseEvents).values({
        id: uuidv7(),
        userId: owner,
        medicationId: med.id,
        scheduledFor: new Date("2026-02-01T08:00:00Z"),
        status: "skipped",
        skippedAt: new Date("2026-02-01T08:20:00Z"),
        skippedReason: "Feeling fine",
      });

      const meds = await settingsService.exportCsv(tx, owner, "medications");
      expect(meds.filename).toBe(
        `meditrackai-medications-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      const medHeader = meds.csv.split("\n")[0]!;
      expect(medHeader).toBe(
        "id,name,dosage_amount,dosage_unit,status,start_date,end_date,reminders_enabled",
      );
      expect(meds.csv).toContain('"Aspirin, ""low"" dose"');

      const events = await settingsService.exportCsv(tx, owner, "dose_events");
      expect(events.csv).toContain("scheduled_for,status");
      expect(events.csv).toContain("2026-02-01T08:00:00.000Z,skipped");
      expect(events.csv).toContain("Feeling fine");

      const all = await settingsService.exportCsv(tx, owner, "all");
      expect(all.filename).toContain("meditrackai-vault-");
      expect(all.csv).toContain("Aspirin"); // both sections present
      expect(all.csv).toContain("scheduled_for");
    });
  }, 30_000);

  it("deleteAllData wipes clinical rows but keeps the account usable", async () => {
    await inRollbackTransaction(async (tx, { owner, stranger }) => {
      const med = await seedMedication(tx, owner);
      const theirMed = await seedMedication(tx, stranger);
      const eventId = uuidv7();
      await tx.insert(doseEvents).values({
        id: eventId,
        userId: owner,
        medicationId: med.id,
        scheduledFor: new Date("2026-02-01T08:00:00Z"),
        status: "taken",
      });
      await tx
        .insert(doseActions)
        .values({ id: uuidv7(), userId: owner, doseEventId: eventId, action: "take" });
      await tx.insert(aiInsights).values({
        id: uuidv7(),
        userId: owner,
        category: "general",
        summary: "Keep it up",
        dataSnapshot: {},
        source: "fallback",
      });
      await tx.insert(notifications).values({
        id: uuidv7(),
        userId: owner,
        type: "system",
        title: "Hi",
        body: "There",
      });
      await tx.insert(adherenceDaily).values({ id: uuidv7(), userId: owner, date: "2026-02-01" });
      await tx.insert(userPreferences).values({ userId: owner, theme: "dark" });

      const result = await settingsService.deleteAllData(tx, owner);
      expect(result).toEqual({ deleted: true });

      expect(await countFor(tx, doseEvents, owner)).toBe(0);
      expect(await countFor(tx, doseActions, owner)).toBe(0);
      expect(await countFor(tx, aiInsights, owner)).toBe(0);
      expect(await countFor(tx, notifications, owner)).toBe(0);
      expect(await countFor(tx, adherenceDaily, owner)).toBe(0);

      // The account + preferences survive; the stranger is untouched.
      expect(await settingsService.getProfile(tx, owner)).toMatchObject({ name: "Settings Owner" });
      expect(await settingsService.getAppearance(tx, owner)).toMatchObject({ theme: "dark" });
      expect(await countFor(tx, doseEvents, stranger)).toBe(0);
      const [theirEvent] = await tx
        .select({ id: doseEvents.id })
        .from(doseEvents)
        .where(eq(doseEvents.medicationId, theirMed.id));
      expect(theirEvent).toBeUndefined();
    });
  }, 30_000);

  it("deleteAccount removes the account itself and refuses the demo user", async () => {
    await inRollbackTransaction(async (tx, { owner }) => {
      const med = await seedMedication(tx, owner);
      await tx.insert(doseEvents).values({
        id: uuidv7(),
        userId: owner,
        medicationId: med.id,
        scheduledFor: new Date("2026-02-01T08:00:00Z"),
        status: "taken",
      });

      await settingsService.deleteAccount(tx, owner);
      await expect(settingsService.getProfile(tx, owner)).rejects.toBeInstanceOf(SettingsError);

      // The demo account is protected: it is the presentation fixture, not a real user.
      const demoId = "demo-guard-user";
      await tx.insert(users).values({
        id: demoId,
        name: "Demo",
        email: `demo-guard-${uuidv7()}@meditrackai.local`,
        isDemo: true,
      });
      await expect(settingsService.deleteAllData(tx, demoId)).rejects.toBeInstanceOf(SettingsError);
      await expect(settingsService.deleteAccount(tx, demoId)).rejects.toBeInstanceOf(SettingsError);
    });
  }, 30_000);

  it("caregiver alert rows are removed from both sides of a relationship", async () => {
    await inRollbackTransaction(async (tx, { owner, stranger }) => {
      const relId = uuidv7();
      await tx.insert(caregiverRelationships).values({
        id: relId,
        patientUserId: owner,
        caregiverUserId: stranger,
        status: "active",
        permissions: DEFAULT_CAREGIVER_PERMISSIONS,
      });
      await tx.insert(caregiverAlerts).values({
        id: uuidv7(),
        relationshipId: relId,
        patientUserId: owner,
        caregiverUserId: stranger,
        type: "missed_dose",
        status: "new",
        title: "Missed dose",
        body: "Metformin 20:00",
      });

      const [alerts] = await tx
        .select({ n: count() })
        .from(caregiverAlerts)
        .where(
          and(
            eq(caregiverAlerts.patientUserId, owner),
            eq(caregiverAlerts.caregiverUserId, stranger),
          ),
        );
      expect(Number(alerts!.n)).toBe(1);

      await settingsService.deleteAllDataRows(tx, owner);
      const [after] = await tx
        .select({ n: count() })
        .from(caregiverAlerts)
        .where(eq(caregiverAlerts.patientUserId, owner));
      expect(Number(after!.n)).toBe(0);
    });
  }, 30_000);
});

describe("destructive-action typed confirmation (shared contract)", () => {
  it("requires the exact phrase, and rejects the other flow's phrase", () => {
    expect(deleteAllDataSchema.safeParse({ confirmation: DELETE_DATA_CONFIRM }).success).toBe(true);
    expect(
      deleteAllDataSchema.safeParse({ confirmation: `  ${DELETE_DATA_CONFIRM}  ` }).success,
    ).toBe(true);
    expect(deleteAllDataSchema.safeParse({ confirmation: "delete my data" }).success).toBe(false);
    expect(deleteAllDataSchema.safeParse({ confirmation: DELETE_ACCOUNT_CONFIRM }).success).toBe(
      false,
    );
    expect(deleteAllDataSchema.safeParse({ confirmation: "" }).success).toBe(false);

    expect(deleteAccountSchema.safeParse({ confirmation: DELETE_ACCOUNT_CONFIRM }).success).toBe(
      true,
    );
    expect(deleteAccountSchema.safeParse({ confirmation: DELETE_DATA_CONFIRM }).success).toBe(
      false,
    );
  });
});
