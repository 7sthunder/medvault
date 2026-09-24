/**
 * Phase 07 — schedule slot / schedule contract (plan §13 `scheduleSchema`, §11.6).
 * A medication's schedule is 1…MAX_SCHEDULE_SLOTS slots; each slot is a local `HH:mm`
 * time + a non-empty weekday subset. No two slots may share the same `(time, dayset)`
 * pair (dedupe happens here AND in the wizard builder).
 */

import { z } from "zod";

import { DOSAGE_AMOUNT_MAX, MAX_SCHEDULE_SLOTS } from "../constants";
import { HHMM_REGEX } from "../times";

export const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;

export const scheduleSlotSchema = z.object({
  timeOfDay: z.string().trim().regex(HHMM_REGEX, "Enter a valid time (HH:MM)."),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Pick at least one day.")
    .max(7)
    .refine((days) => new Set(days).size === days.length, "Duplicate days are not allowed."),
  dosageAmount: z.coerce
    .number()
    .positive("Dosage must be greater than 0.")
    .max(DOSAGE_AMOUNT_MAX, `Dosage must be at most ${DOSAGE_AMOUNT_MAX}.`)
    .nullish(),
  instructionOverride: z.string().trim().max(200, "At most 200 characters.").nullish(),
  enabled: z.boolean().default(true),
});

/** Sorted day-key used to compare "same day set" (order-insensitive). */
function daySetKey(days: readonly number[]): string {
  return [...days].sort((a, b) => a - b).join(",");
}

export const scheduleSchema = z
  .object({
    slots: z
      .array(scheduleSlotSchema)
      .min(1, "Add at least one daily time.")
      .max(MAX_SCHEDULE_SLOTS, `At most ${MAX_SCHEDULE_SLOTS} daily times.`),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.slots.forEach((slot, i) => {
      const key = `${slot.timeOfDay}|${daySetKey(slot.daysOfWeek)}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slots", i],
          message: "This time slot is already listed for these days.",
        });
      }
      seen.add(key);
    });
  });

export type ScheduleSlotInput = z.infer<typeof scheduleSlotSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;