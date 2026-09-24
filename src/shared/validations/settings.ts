/**
 * Phase 07 — settings contracts (plan §13 `settingsSchema`, §10.11/§11.14).
 * Three independent, shareable schemas: profile, reminders, appearance.
 */

import { z } from "zod";

import { VALUE_LIMITS } from "../constants";
import { THEMES, UI_DENSITIES } from "../enums";
import { emailSchema, nameSchema, timezoneSchema } from "./common";

export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  timezone: timezoneSchema,
});

export const notificationPrefsSchema = z.object({
  doseReminders: z.boolean(),
  caregiverMissedAlerts: z.boolean(),
  insights: z.boolean(),
  sounds: z.boolean(),
});

export const caregiverAlertPrefsSchema = z.object({
  missedDoseOn: z.boolean(),
  adherenceDropThreshold: z.coerce.number().int().min(0).max(100).nullable(),
  dailyDigest: z.boolean(),
});

export const reminderSettingsSchema = z.object({
  missedAfterMinutes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.missedAfterMinutes.min)
    .max(VALUE_LIMITS.missedAfterMinutes.max),
  snoozeMinutes: z.coerce.number().int().min(VALUE_LIMITS.snoozeMinutes.min).max(VALUE_LIMITS.snoozeMinutes.max),
  maxSnoozes: z.coerce.number().int().min(VALUE_LIMITS.maxSnoozes.min).max(VALUE_LIMITS.maxSnoozes.max),
  reminderBeforeMinutes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.reminderBeforeMinutes.min)
    .max(VALUE_LIMITS.reminderBeforeMinutes.max),
  notificationPrefs: notificationPrefsSchema,
  caregiverAlertPrefs: caregiverAlertPrefsSchema,
});

export const appearanceSchema = z.object({
  theme: z.enum(THEMES),
  reduceMotion: z.boolean(),
  uiDensity: z.enum(UI_DENSITIES),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;
export type AppearanceInput = z.infer<typeof appearanceSchema>;