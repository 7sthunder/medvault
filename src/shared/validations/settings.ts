/**
 * Phase 07 — settings contracts (plan §13 `settingsSchema`, §10.11/§11.14).
 * Three independent, shareable schemas: profile, reminders, appearance.
 *
 * Phase 18 adds the data-governance inputs (typed confirmation phrases for the two
 * destructive flows) — the phrase is the *only* proof of intent, so it lives in the
 * shared contract and both the client form and the router validate against it.
 */

import { z } from "zod";

import { VALUE_LIMITS } from "../constants";
import { DEMO_SCENARIOS, THEMES, UI_DENSITIES } from "../enums";
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
  snoozeMinutes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.snoozeMinutes.min)
    .max(VALUE_LIMITS.snoozeMinutes.max),
  maxSnoozes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.maxSnoozes.min)
    .max(VALUE_LIMITS.maxSnoozes.max),
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

/* ── Phase 18 — §10.11 data governance ────────────────────────────────────── */

/** Phrase the user must retype to confirm "delete all data" (account is kept). */
export const DELETE_DATA_CONFIRM = "DELETE MY DATA";

/** Phrase for the irreversible whole-account wipe — deliberately different. */
export const DELETE_ACCOUNT_CONFIRM = "DELETE MY ACCOUNT";

/**
 * Typed confirmation for a destructive settings action. The phrase must match exactly
 * (trimmed) — a partial or case-mismatched phrase is rejected, so a stray paste cannot
 * wipe a vault.
 */
function typedConfirmation(phrase: string, label: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === phrase, { message: `Type ${label} exactly to confirm.` });
}

/** `/settings/data` → "Delete all data" (keeps the account). */
export const deleteAllDataSchema = z.object({
  confirmation: typedConfirmation(DELETE_DATA_CONFIRM, `“${DELETE_DATA_CONFIRM}”`),
});

/** `/settings/data` → "Delete account" (wipes auth rows too). */
export const deleteAccountSchema = z.object({
  confirmation: typedConfirmation(DELETE_ACCOUNT_CONFIRM, `“${DELETE_ACCOUNT_CONFIRM}”`),
});

/** CSV export scope — §10.11 `exportCsv(scope)`. */
export const exportScopeSchema = z.enum(["medications", "dose_events", "all"]);

/** `/settings/reminders` → per-medication `remindersEnabled` bulk toggle. */
export const medicationReminderToggleSchema = z.object({
  medicationIds: z.array(z.string().min(1)).min(1).max(200),
  remindersEnabled: z.boolean(),
});

export type DeleteAllDataInput = z.infer<typeof deleteAllDataSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type ExportScope = z.infer<typeof exportScopeSchema>;

/* ── Phase 18 — §10.8 demo simulation contracts ───────────────────────────── */

/** Simulated dose outcome — maps onto the real dose-action service calls. */
export const DEMO_ACTIONS = ["take", "miss", "skip", "snooze"] as const;
export type DemoAction = (typeof DEMO_ACTIONS)[number];

/** `/demo` dock: simulate one outcome against a specific dose or the next due dose. */
export const demoActionSchema = z.object({
  action: z.enum(DEMO_ACTIONS),
  /** Omit to target the next due dose (the dock's default). */
  doseEventId: z.string().min(1).optional(),
  skipReason: z.string().trim().max(200).optional(),
});

/** `/demo` dock: seed a 14-day adherence block that moves the charts. */
export const demoScenarioSchema = z.object({
  scenario: z.enum(DEMO_SCENARIOS),
});

/** `/demo` clock: an absolute simulated instant, bounded to ±1 year of real time. */
export const demoTimeSchema = z.object({
  simulationNow: z.coerce.date().refine(
    (value) => {
      const drift = Math.abs(value.getTime() - Date.now());
      return drift <= 366 * 24 * 60 * 60 * 1000;
    },
    { message: "Simulated time must be within a year of the real clock." },
  ),
});

export type DemoActionInput = z.infer<typeof demoActionSchema>;
export type DemoScenarioInput = z.infer<typeof demoScenarioSchema>;
export type DemoTimeInput = z.infer<typeof demoTimeSchema>;
