import { z } from "zod";
import { THEMES, UI_DENSITIES } from "../enums";
import { emailSchema, timezoneSchema } from "./common";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  timezone: timezoneSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  timezone: timezoneSchema,
});

export const notificationPrefsSchema = z.object({
  doseReminders: z.boolean().default(true),
  caregiverMissedAlerts: z.boolean().default(true),
  insights: z.boolean().default(true),
  sounds: z.boolean().default(true),
});

export const caregiverAlertPrefsSchema = z.object({
  missedDoseOn: z.boolean().default(true),
  adherenceDropThreshold: z.number().min(0).max(100).nullable().optional(),
  dailyDigest: z.boolean().default(false),
});

export const reminderSettingsSchema = z.object({
  missedAfterMinutes: z.coerce.number().int().min(5).max(120),
  snoozeMinutes: z.coerce.number().int().min(1).max(60),
  maxSnoozes: z.coerce.number().int().min(0).max(10),
  reminderBeforeMinutes: z.coerce.number().int().min(0).max(60),
  notificationPrefs: notificationPrefsSchema,
  caregiverAlertPrefs: caregiverAlertPrefsSchema.optional(),
  perMedicationReminders: z
    .array(
      z.object({
        medicationId: z.string(),
        remindersEnabled: z.boolean(),
      }),
    )
    .optional(),
});

export const updateRemindersSchema = reminderSettingsSchema;

export const updateCaregiverPrefsSchema = z.object({
  caregiverAlertPrefs: caregiverAlertPrefsSchema,
});

export const appearanceSchema = z.object({
  theme: z.enum(THEMES),
  uiDensity: z.enum(UI_DENSITIES),
  reduceMotion: z.boolean(),
});

export const updateAppearanceSchema = appearanceSchema;

export const deleteDataSchema = z.object({
  confirmPhrase: z.literal("DELETE ALL DATA"),
});

export const deleteAccountSchema = z.object({
  confirmPhrase: z.literal("DELETE MY ACCOUNT"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;
export type UpdateRemindersInput = z.infer<typeof updateRemindersSchema>;
export type UpdateCaregiverPrefsInput = z.infer<typeof updateCaregiverPrefsSchema>;
export type AppearanceInput = z.infer<typeof appearanceSchema>;
export type UpdateAppearanceInput = z.infer<typeof updateAppearanceSchema>;
export type DeleteDataInput = z.infer<typeof deleteDataSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;