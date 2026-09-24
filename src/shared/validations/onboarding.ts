/**
 * Phase 07 — onboarding contract (plan §13 `onboardingSchema`, §11.3).
 * Step values are number inputs (strings on the wire) → `.coerce`. Bounds live in
 * `shared/constants.ts` so onboarding and settings reminders never drift apart.
 */

import { z } from "zod";

import { TIMEZONE_LIST, timezoneSchema } from "./common";
import { VALUE_LIMITS } from "../constants";

export const onboardingSchema = z.object({
  timezone: timezoneSchema,
  missedAfterMinutes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.missedAfterMinutes.min, "Must be at least 5 minutes.")
    .max(VALUE_LIMITS.missedAfterMinutes.max, "Must be at most 120 minutes."),
  snoozeMinutes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.snoozeMinutes.min, "Must be at least 1 minute.")
    .max(VALUE_LIMITS.snoozeMinutes.max, "Must be at most 60 minutes."),
  maxSnoozes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.maxSnoozes.min, "Must be at least 0.")
    .max(VALUE_LIMITS.maxSnoozes.max, "Must be at most 10."),
  reminderBeforeMinutes: z.coerce
    .number()
    .int()
    .min(VALUE_LIMITS.reminderBeforeMinutes.min, "Must be at least 0 minutes.")
    .max(VALUE_LIMITS.reminderBeforeMinutes.max, "Must be at most 60 minutes."),
  /** Optional "Add a sample medication" (§11.3: Metformin 500mg twice daily). */
  addSampleMed: z.boolean().default(false),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Space-separated subset of IANA zones for the wizard <select>. */
export { TIMEZONE_LIST };