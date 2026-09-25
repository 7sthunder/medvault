/**
 * Phase 10 — onboarding contract (plan §13 `onboardingSchema`, §11.4).
 * Collects profile + reminder defaults at the end of signup: the user's IANA
 * timezone, the four global reminder numbers (falling back to the §10.3 engine
 * defaults when the wizard is skipped), and the optional sample-medication
 * quick-start toggle. Shared by the wizard form, the tRPC router (server
 * authority), and onboarding unit tests.
 */

import { z } from "zod";

import { VALUE_LIMITS } from "../constants";
import { timezoneSchema } from "./common";

const intInRange = (min: number, max: number, label: string) =>
  z.coerce.number().int().min(min, `${label} must be at least ${min}.`).max(max, `${label} must be at most ${max}.`);

export const onboardingSchema = z.object({
  timezone: timezoneSchema,
  missedAfterMinutes: intInRange(
    VALUE_LIMITS.missedAfterMinutes.min,
    VALUE_LIMITS.missedAfterMinutes.max,
    "Missed-after",
  ),
  snoozeMinutes: intInRange(VALUE_LIMITS.snoozeMinutes.min, VALUE_LIMITS.snoozeMinutes.max, "Snooze"),
  maxSnoozes: intInRange(VALUE_LIMITS.maxSnoozes.min, VALUE_LIMITS.maxSnoozes.max, "Snoozes"),
  reminderBeforeMinutes: intInRange(
    VALUE_LIMITS.reminderBeforeMinutes.min,
    VALUE_LIMITS.reminderBeforeMinutes.max,
    "Reminder-before",
  ),
  addSampleMed: z.boolean().default(false),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;