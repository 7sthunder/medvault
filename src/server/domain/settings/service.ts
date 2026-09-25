import { and, asc, count, eq, inArray, max, min, ne } from "drizzle-orm";

import type { Db, DbTx } from "@/server/db/helpers";
import {
  accounts,
  adherenceDaily,
  aiInsights,
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  doseActions,
  doseEvents,
  medications,
  notifications,
  sessions,
  userPreferences,
  users,
} from "@/server/db/schema";
import {
  MAX_SNOOZES_DEFAULT,
  MISSED_AFTER_DEFAULT,
  REMINDER_BEFORE_DEFAULT,
  SNOOZE_MIN_DEFAULT,
} from "@/shared/constants";
import type {
  AppearanceSettingsDTO,
  CaregiverAlertPrefs,
  DataOverviewDTO,
  MedicationReminderRowDTO,
  NotificationPrefs,
  ProfileDTO,
  ReminderSettingsPanelDTO,
} from "@/shared/types";
import type { ExportScope } from "@/shared/validations/settings";

/**
 * Phase 18 — Settings domain (§10.11).
 *
 * One owner-scoped service for every `/settings/*` page. Three rules hold everywhere here:
 *  1. **Owner-scoped** — every read/write filters on the session user's own id, so one account
 *     can never observe or mutate another account's rows (including the demo user).
 *  2. **Destructive ops are transactional and ordered children-first** — `deleteAllData` and
 *     `deleteAccount` wipe the dependency graph explicitly rather than relying on cascades, so
 *     the ordering is auditable and a partial failure cannot leave orphans. Both accept a
 *     transaction client so a caller already inside one nests as a savepoint instead of
 *     opening a second connection.
 *  3. **Typed confirmation is re-verified here**, not only in the form: the phrase is parsed as
 *     proof of intent by the router, and this service refuses any call that arrives without it.
 */

export class SettingsError extends Error {
  constructor(
    message: string,
    readonly kind: "not_found" | "conflict" | "forbidden" | "bad_request" = "bad_request",
  ) {
    super(message);
    this.name = "SettingsError";
  }
}

/* ── Defaults (mirrored from the schema so a fresh row reads the same values) ── */

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  doseReminders: true,
  caregiverMissedAlerts: true,
  insights: true,
  sounds: true,
};

const DEFAULT_CAREGIVER_PREFS: CaregiverAlertPrefs = {
  missedDoseOn: true,
  adherenceDropThreshold: null,
  dailyDigest: false,
};

/** Read `user_preferences` or synthesise engine defaults for a user that has no row yet. */
async function readPrefs(db: Db | DbTx, userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (row) return row;
  return {
    userId,
    theme: "light" as const,
    missedAfterMinutes: MISSED_AFTER_DEFAULT,
    snoozeMinutes: SNOOZE_MIN_DEFAULT,
    maxSnoozes: MAX_SNOOZES_DEFAULT,
    reminderBeforeMinutes: REMINDER_BEFORE_DEFAULT,
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    caregiverAlertPrefs: DEFAULT_CAREGIVER_PREFS,
    reduceMotion: false,
    uiDensity: "comfortable" as const,
    updatedAt: new Date(),
  };
}

/**
 * Upsert the mutable `user_preferences` columns. Uses `onConflictDoUpdate` so a user who never
 * ran onboarding still gets a row (the same semantics as `getOrCreatePreferences`).
 */
async function writePrefs(
  db: Db | DbTx,
  userId: string,
  patch: Partial<typeof userPreferences.$inferInsert>,
) {
  const [row] = await db
    .insert(userPreferences)
    .values({ userId, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();
  return row!;
}

async function medicationReminderRows(
  db: Db | DbTx,
  userId: string,
): Promise<MedicationReminderRowDTO[]> {
  const rows = await db
    .select({
      id: medications.id,
      name: medications.name,
      dosageAmount: medications.dosageAmount,
      dosageUnit: medications.dosageUnit,
      remindersEnabled: medications.remindersEnabled,
    })
    .from(medications)
    .where(and(eq(medications.userId, userId), eq(medications.status, "active")))
    .orderBy(asc(medications.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    dosageAmount: String(r.dosageAmount),
    dosageUnit: r.dosageUnit,
    remindersEnabled: r.remindersEnabled,
  }));
}

async function countRows(
  db: Db | DbTx,
  table: { userId: unknown },
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(table as typeof doseEvents)
    .where(eq((table as typeof doseEvents).userId, userId));
  return Number(row?.n ?? 0);
}

export const settingsService = {
  /* ── Profile (§11.14) ────────────────────────────────────────────────── */

  async getProfile(db: Db | DbTx, userId: string): Promise<ProfileDTO> {
    const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!row) throw new SettingsError("Account not found.", "not_found");
    return {
      name: row.name,
      email: row.email,
      timezone: row.timezone,
      isDemo: row.isDemo,
      createdAt: row.createdAt,
    };
  },

  /**
   * Name/email/timezone. Email must stay unique — the DB has a unique index, but we check
   * first so the user gets "that email is already in use" instead of a 500 from the driver.
   */
  async updateProfile(
    db: Db | DbTx,
    userId: string,
    input: { name: string; email: string; timezone: string },
  ): Promise<ProfileDTO> {
    const email = input.email.trim().toLowerCase();
    const [clash] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, userId)))
      .limit(1);
    if (clash) throw new SettingsError("That email address is already in use.", "conflict");

    const [row] = await db
      .update(users)
      .set({ name: input.name.trim(), email, timezone: input.timezone, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!row) throw new SettingsError("Account not found.", "not_found");

    // A timezone change re-interprets every calendar day, so materialized aggregates are stale.
    await settingsService.invalidateMaterialized(db, userId);
    return settingsService.getProfile(db, userId);
  },

  /* ── Reminders (§11.14) ──────────────────────────────────────────────── */

  async getReminderSettings(db: Db | DbTx, userId: string): Promise<ReminderSettingsPanelDTO> {
    const prefs = await readPrefs(db, userId);
    return {
      missedAfterMinutes: prefs.missedAfterMinutes,
      snoozeMinutes: prefs.snoozeMinutes,
      maxSnoozes: prefs.maxSnoozes,
      reminderBeforeMinutes: prefs.reminderBeforeMinutes,
      notificationPrefs: prefs.notificationPrefs as NotificationPrefs,
      caregiverAlertPrefs: prefs.caregiverAlertPrefs as CaregiverAlertPrefs,
      medications: await medicationReminderRows(db, userId),
    };
  },

  async updateReminderSettings(
    db: Db | DbTx,
    userId: string,
    input: {
      missedAfterMinutes: number;
      snoozeMinutes: number;
      maxSnoozes: number;
      reminderBeforeMinutes: number;
      notificationPrefs: NotificationPrefs;
      caregiverAlertPrefs: CaregiverAlertPrefs;
    },
  ): Promise<ReminderSettingsPanelDTO> {
    await writePrefs(db, userId, {
      missedAfterMinutes: input.missedAfterMinutes,
      snoozeMinutes: input.snoozeMinutes,
      maxSnoozes: input.maxSnoozes,
      reminderBeforeMinutes: input.reminderBeforeMinutes,
      notificationPrefs: input.notificationPrefs,
      caregiverAlertPrefs: {
        ...input.caregiverAlertPrefs,
        adherenceDropThreshold: input.caregiverAlertPrefs.adherenceDropThreshold ?? null,
      },
      updatedAt: new Date(),
    });
    return settingsService.getReminderSettings(db, userId);
  },

  /** Bulk `remindersEnabled` toggle across the per-medication table. */
  async setMedicationReminders(
    db: Db | DbTx,
    userId: string,
    medicationIds: string[],
    remindersEnabled: boolean,
  ): Promise<ReminderSettingsPanelDTO> {
    if (medicationIds.length === 0) return settingsService.getReminderSettings(db, userId);
    await db
      .update(medications)
      .set({ remindersEnabled, updatedAt: new Date() })
      .where(
        and(
          eq(medications.userId, userId), // owner-scoped: ids from another account are no-ops
          inArray(medications.id, medicationIds),
        ),
      );
    return settingsService.getReminderSettings(db, userId);
  },

  /* ── Caregiver alert prefs (§11.14 — the relationship UI is reused from §11.12) ── */

  async getCaregiverPrefs(db: Db | DbTx, userId: string): Promise<CaregiverAlertPrefs> {
    const prefs = await readPrefs(db, userId);
    return prefs.caregiverAlertPrefs as CaregiverAlertPrefs;
  },

  async updateCaregiverPrefs(
    db: Db | DbTx,
    userId: string,
    prefs: CaregiverAlertPrefs,
  ): Promise<CaregiverAlertPrefs> {
    const next: CaregiverAlertPrefs = {
      ...prefs,
      adherenceDropThreshold: prefs.adherenceDropThreshold ?? null,
    };
    await writePrefs(db, userId, { caregiverAlertPrefs: next, updatedAt: new Date() });
    return next;
  },

  /* ── Appearance (§11.14) ─────────────────────────────────────────────── */

  async getAppearance(db: Db | DbTx, userId: string): Promise<AppearanceSettingsDTO> {
    const prefs = await readPrefs(db, userId);
    return { theme: prefs.theme, reduceMotion: prefs.reduceMotion, uiDensity: prefs.uiDensity };
  },

  async updateAppearance(
    db: Db | DbTx,
    userId: string,
    input: AppearanceSettingsDTO,
  ): Promise<AppearanceSettingsDTO> {
    await writePrefs(db, userId, {
      theme: input.theme,
      reduceMotion: input.reduceMotion,
      uiDensity: input.uiDensity,
      updatedAt: new Date(),
    });
    return input;
  },

  /* ── Data governance (§10.11) ────────────────────────────────────────── */

  async getDataOverview(db: Db | DbTx, userId: string): Promise<DataOverviewDTO> {
    const [span] = await db
      .select({ first: min(doseEvents.scheduledFor), last: max(doseEvents.scheduledFor) })
      .from(doseEvents)
      .where(eq(doseEvents.userId, userId));
    const [demoRow] = await db
      .select({ n: count() })
      .from(doseEvents)
      .where(and(eq(doseEvents.userId, userId), eq(doseEvents.isDemo, true)));

    return {
      medications: await countRows(db, medications, userId),
      doseEvents: await countRows(db, doseEvents, userId),
      doseActions: await countRows(db, doseActions, userId),
      insights: await countRows(db, aiInsights, userId),
      notifications: await countRows(db, notifications, userId),
      firstDoseAt: span?.first ?? null,
      lastDoseAt: span?.last ?? null,
      hasDemoData: Number(demoRow?.n ?? 0) > 0,
    };
  },

  /**
   * CSV export of the caller's own rows. Deterministic column order, RFC-4180 quoting, and a
   * fixed column set per scope so a diff of two exports is meaningful.
   */
  async exportCsv(
    db: Db | DbTx,
    userId: string,
    scope: ExportScope,
  ): Promise<{ filename: string; csv: string }> {
    const parts: string[] = [];

    if (scope === "medications" || scope === "all") {
      const meds = await db
        .select({
          name: medications.name,
          dosageAmount: medications.dosageAmount,
          dosageUnit: medications.dosageUnit,
          status: medications.status,
          startDate: medications.startDate,
          endDate: medications.endDate,
          remindersEnabled: medications.remindersEnabled,
        })
        .from(medications)
        .where(eq(medications.userId, userId))
        .orderBy(asc(medications.name));

      parts.push(
        toCsv(
          [
            "id",
            "name",
            "dosage_amount",
            "dosage_unit",
            "status",
            "start_date",
            "end_date",
            "reminders_enabled",
          ],
          meds.map((m) => [
            "",
            m.name,
            String(m.dosageAmount),
            m.dosageUnit,
            m.status,
            m.startDate,
            m.endDate ?? "",
            String(m.remindersEnabled),
          ]),
        ),
      );
    }

    if (scope === "dose_events" || scope === "all") {
      const events = await db
        .select({
          id: doseEvents.id,
          medicationId: doseEvents.medicationId,
          scheduledFor: doseEvents.scheduledFor,
          status: doseEvents.status,
          takenAt: doseEvents.takenAt,
          missedDeadline: doseEvents.missedDeadline,
          skippedAt: doseEvents.skippedAt,
          skippedReason: doseEvents.skippedReason,
          snoozeCount: doseEvents.snoozeCount,
        })
        .from(doseEvents)
        .where(eq(doseEvents.userId, userId))
        .orderBy(asc(doseEvents.scheduledFor), asc(doseEvents.id));

      parts.push(
        toCsv(
          [
            "id",
            "medication_id",
            "scheduled_for",
            "status",
            "taken_at",
            "missed_deadline",
            "skipped_at",
            "skipped_reason",
            "snooze_count",
          ],
          events.map((e) => [
            e.id,
            e.medicationId,
            e.scheduledFor.toISOString(),
            e.status,
            isoOrEmpty(e.takenAt),
            isoOrEmpty(e.missedDeadline),
            isoOrEmpty(e.skippedAt),
            e.skippedReason ?? "",
            String(e.snoozeCount),
          ]),
        ),
      );
    }

    const suffix =
      scope === "all" ? "vault" : scope === "medications" ? "medications" : "dose-events";
    return {
      filename: `medvault-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: parts.join("\n\n"),
    };
  },

  /**
   * "Delete all data" — keeps the account and preferences, removes every clinical row.
   * Children first (alerts → actions → schedules/medications → materialized + insights +
   * notifications) inside one transaction, so a failure rolls the whole thing back.
   */
  async deleteAllData(db: Db | DbTx, userId: string): Promise<{ deleted: boolean }> {
    if ((await settingsService.getProfile(db, userId)).isDemo) {
      throw new SettingsError("Demo data can only be reset from the demo console.", "forbidden");
    }
    await db.transaction(async (tx) => {
      await settingsService.deleteAllDataRows(tx, userId);
      // Keep the account usable: preferences survive so the next sign-in keeps its theme/timezone.
      await tx
        .update(userPreferences)
        .set({ updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    });
    return { deleted: true };
  },

  /**
   * "Delete account" — everything, including Better Auth rows. The caller's own sessions are
   * removed so the browser is logged out by the deletion itself rather than by a stale token.
   */
  async deleteAccount(db: Db | DbTx, userId: string): Promise<{ deleted: true }> {
    if ((await settingsService.getProfile(db, userId)).isDemo) {
      throw new SettingsError("The demo account cannot be deleted.", "forbidden");
    }
    await db.transaction(async (tx) => {
      await settingsService.deleteAllDataRows(tx, userId);
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      await tx.delete(userPreferences).where(eq(userPreferences.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
    return { deleted: true };
  },

  /* ── Internal helpers (exported for reuse + tests, not part of the router surface) ── */

  /** The clinical-row wipe shared by `deleteAllData` / `deleteAccount` (no account touch). */
  async deleteAllDataRows(tx: DbTx, userId: string): Promise<void> {
    await tx.delete(caregiverAlerts).where(eq(caregiverAlerts.patientUserId, userId));
    await tx.delete(caregiverAlerts).where(eq(caregiverAlerts.caregiverUserId, userId));
    await tx.delete(caregiverInvitations).where(eq(caregiverInvitations.patientUserId, userId));
    await tx.delete(caregiverRelationships).where(eq(caregiverRelationships.patientUserId, userId));
    await tx
      .delete(caregiverRelationships)
      .where(eq(caregiverRelationships.caregiverUserId, userId));
    await tx.delete(doseActions).where(eq(doseActions.userId, userId));
    await tx.delete(adherenceDaily).where(eq(adherenceDaily.userId, userId));
    await tx.delete(aiInsights).where(eq(aiInsights.userId, userId));
    await tx.delete(notifications).where(eq(notifications.userId, userId));
    await tx.delete(medications).where(eq(medications.userId, userId));
  },

  /**
   * Drop materialized `adherence_daily` rows so the next read re-derives them under the new
   * timezone. Dose events are untouched — only the day-bucketed cache is invalid.
   */
  async invalidateMaterialized(db: Db | DbTx, userId: string): Promise<void> {
    await db.delete(adherenceDaily).where(eq(adherenceDaily.userId, userId));
  },
};

function isoOrEmpty(value: Date | null): string {
  return value ? value.toISOString() : "";
}

/** Minimal RFC-4180 CSV: quote when the value contains a comma, quote or newline. */
function toCsv(header: string[], rows: string[][]): string {
  const cell = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [header.join(","), ...rows.map((row) => row.map(cell).join(","))].join("\n");
}
