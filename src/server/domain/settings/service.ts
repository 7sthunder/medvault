import { and, eq, inArray, or } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import {
  aiInsights,
  caregiverAlerts,
  caregiverRelationships,
  doseEvents,
  medications,
  medicationSchedules,
  notifications,
  userPreferences,
  users,
} from "@/server/db/schema";
import { getOrCreatePreferences, upsertPreferences } from "./get-or-createPreferences";
import type {
  UpdateAppearanceInput,
  UpdateCaregiverPrefsInput,
  UpdateProfileInput,
  UpdateRemindersInput,
} from "@/shared/validations/settings";

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  timezone: string;
  createdAt: Date;
}

export interface MedicationReminderItem {
  id: string;
  name: string;
  color: string;
  remindersEnabled: boolean;
}

export interface ReminderSettingsDTO {
  missedAfterMinutes: number;
  snoozeMinutes: number;
  maxSnoozes: number;
  reminderBeforeMinutes: number;
  notificationPrefs: {
    doseReminders: boolean;
    caregiverMissedAlerts: boolean;
    insights: boolean;
    sounds: boolean;
  };
  medications: MedicationReminderItem[];
}

export interface DataOverviewDTO {
  medicationCount: number;
  doseEventCount: number;
  insightCount: number;
  notificationCount: number;
  caregiverCount: number;
}

export interface ExportDataPayload {
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
  medications: (typeof medications.$inferSelect)[];
  doseEvents: (typeof doseEvents.$inferSelect)[];
  schedules: (typeof medicationSchedules.$inferSelect)[];
  insights: (typeof aiInsights.$inferSelect)[];
  exportedAt: string;
}

/**
 * Retrieves user profile details.
 */
export async function getProfile(db: Db | DbTx, userId: string): Promise<UserProfileDTO> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      timezone: users.timezone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Updates profile details (name, timezone).
 */
export async function updateProfile(
  db: Db | DbTx,
  userId: string,
  input: UpdateProfileInput,
): Promise<UserProfileDTO> {
  await db
    .update(users)
    .set({
      name: input.name,
      timezone: input.timezone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return getProfile(db, userId);
}

/**
 * Retrieves reminder preferences alongside per-medication toggle statuses.
 */
export async function getReminderSettings(
  db: Db | DbTx,
  userId: string,
): Promise<ReminderSettingsDTO> {
  const prefs = await getOrCreatePreferences(db, userId);

  const activeMeds = await db
    .select({
      id: medications.id,
      name: medications.name,
      color: medications.color,
      remindersEnabled: medications.remindersEnabled,
    })
    .from(medications)
    .where(and(eq(medications.userId, userId), eq(medications.status, "active")));

  return {
    missedAfterMinutes: prefs.missedAfterMinutes,
    snoozeMinutes: prefs.snoozeMinutes,
    maxSnoozes: prefs.maxSnoozes,
    reminderBeforeMinutes: prefs.reminderBeforeMinutes,
    notificationPrefs: prefs.notificationPrefs as ReminderSettingsDTO["notificationPrefs"],
    medications: activeMeds,
  };
}

/**
 * Updates reminder thresholds, notification preferences, and per-medication reminder toggles.
 */
export async function updateReminderSettings(
  db: Db | DbTx,
  userId: string,
  input: UpdateRemindersInput,
): Promise<ReminderSettingsDTO> {
  await upsertPreferences(db, userId, {
    missedAfterMinutes: input.missedAfterMinutes,
    snoozeMinutes: input.snoozeMinutes,
    maxSnoozes: input.maxSnoozes,
    reminderBeforeMinutes: input.reminderBeforeMinutes,
    notificationPrefs: input.notificationPrefs,
  });

  if (input.perMedicationReminders && input.perMedicationReminders.length > 0) {
    for (const item of input.perMedicationReminders) {
      await db
        .update(medications)
        .set({
          remindersEnabled: item.remindersEnabled,
          updatedAt: new Date(),
        })
        .where(and(eq(medications.id, item.medicationId), eq(medications.userId, userId)));
    }
  }

  return getReminderSettings(db, userId);
}

/**
 * Updates caregiver alert preferences on user preferences.
 */
export async function updateCaregiverAlertPrefs(
  db: Db | DbTx,
  userId: string,
  input: UpdateCaregiverPrefsInput,
) {
  return upsertPreferences(db, userId, {
    caregiverAlertPrefs: input.caregiverAlertPrefs,
  });
}

/**
 * Updates appearance settings (theme, density, reduceMotion).
 */
export async function updateAppearance(
  db: Db | DbTx,
  userId: string,
  input: UpdateAppearanceInput,
) {
  return upsertPreferences(db, userId, {
    theme: input.theme,
    uiDensity: input.uiDensity,
    reduceMotion: input.reduceMotion,
  });
}

/**
 * Aggregates count of all user-owned records for the data management dashboard.
 */
export async function getDataOverview(db: Db | DbTx, userId: string): Promise<DataOverviewDTO> {
  const meds = await db
    .select({ id: medications.id })
    .from(medications)
    .where(eq(medications.userId, userId));

  const doses = await db
    .select({ id: doseEvents.id })
    .from(doseEvents)
    .where(eq(doseEvents.userId, userId));

  const insights = await db
    .select({ id: aiInsights.id })
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId));

  const notifs = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.userId, userId));

  const caregivers = await db
    .select({ id: caregiverRelationships.id })
    .from(caregiverRelationships)
    .where(
      or(
        eq(caregiverRelationships.patientUserId, userId),
        eq(caregiverRelationships.caregiverUserId, userId),
      ),
    );

  return {
    medicationCount: meds.length,
    doseEventCount: doses.length,
    insightCount: insights.length,
    notificationCount: notifs.length,
    caregiverCount: caregivers.length,
  };
}

/**
 * Returns raw structured datasets for CSV/JSON export.
 */
export async function exportData(db: Db | DbTx, userId: string): Promise<ExportDataPayload> {
  const profile = await getProfile(db, userId);

  const userMeds = await db
    .select()
    .from(medications)
    .where(eq(medications.userId, userId));

  const medIds = userMeds.map((m) => m.id);

  const schedules =
    medIds.length > 0
      ? await db
          .select()
          .from(medicationSchedules)
          .where(inArray(medicationSchedules.medicationId, medIds))
      : [];

  const doses = await db
    .select()
    .from(doseEvents)
    .where(eq(doseEvents.userId, userId));

  const insights = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId));

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      timezone: profile.timezone,
    },
    medications: userMeds,
    doseEvents: doses,
    schedules,
    insights,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Transactionally wipes all user-owned data while preserving the user account.
 */
export async function deleteAllData(db: Db | DbTx, userId: string): Promise<{ success: boolean }> {
  // Wipe child records first
  await db.delete(doseEvents).where(eq(doseEvents.userId, userId));

  const userMeds = await db
    .select({ id: medications.id })
    .from(medications)
    .where(eq(medications.userId, userId));

  const medIds = userMeds.map((m) => m.id);
  if (medIds.length > 0) {
    await db
      .delete(medicationSchedules)
      .where(inArray(medicationSchedules.medicationId, medIds));
  }

  await db.delete(medications).where(eq(medications.userId, userId));
  await db.delete(aiInsights).where(eq(aiInsights.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(caregiverAlerts).where(eq(caregiverAlerts.caregiverUserId, userId));
  await db
    .delete(caregiverRelationships)
    .where(
      or(
        eq(caregiverRelationships.patientUserId, userId),
        eq(caregiverRelationships.caregiverUserId, userId),
      ),
    );

  // Reset user preferences back to default
  await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
  await getOrCreatePreferences(db, userId);

  return { success: true };
}

/**
 * Permanently deletes the user account and cascades all associated records.
 */
export async function deleteAccount(db: Db | DbTx, userId: string): Promise<{ success: boolean }> {
  await deleteAllData(db, userId);
  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}
