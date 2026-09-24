/**
 * Phase 07 — medication contract (plan §13 `medicationSchema`, §11.6). Shared by the
 * create/edit wizard, the tRPC router (server authority), and history/report filters.
 */

import { z } from "zod";

import {
  DOSAGE_AMOUNT_MAX,
  INSTRUCTIONS_MAX,
  MED_NAME_MAX,
  NOTES_MAX,
} from "../constants";
import { MEDICATION_STATUSES } from "../enums";
import { dateKeySchema } from "./common";

/** Common dosage units offered by the wizard select (§11.6); a custom unit ≤ 20 chars is allowed. */
export const DOSAGE_UNITS = ["mg", "mcg", "g", "IU", "tablet", "ml", "units"] as const;

/** Default med accent colour (§5.3 primary). */
export const DEFAULT_MED_COLOR = "#10b981";

/** TS assumes `.string()` rejects `null`; build a nullable text union explicitly. */
const nullableText = (schema: z.ZodString) => schema.nullable().optional();

export const medicationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(MED_NAME_MAX, `Name must be at most ${MED_NAME_MAX} characters.`)
      .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), "Name must not contain control characters."),
    dosageAmount: z.coerce
      .number()
      .positive("Dosage must be greater than 0.")
      .max(DOSAGE_AMOUNT_MAX, `Dosage must be at most ${DOSAGE_AMOUNT_MAX}.`),
    dosageUnit: z
      .string()
      .trim()
      .min(1, "Unit is required.")
      .max(20, "Unit must be at most 20 characters."),
    instructions: nullableText(z.string().trim().max(INSTRUCTIONS_MAX, `At most ${INSTRUCTIONS_MAX} characters.`)),
    notes: nullableText(z.string().trim().max(NOTES_MAX, `At most ${NOTES_MAX} characters.`)),
    status: z.enum(MEDICATION_STATUSES).default("active"),
    startDate: dateKeySchema,
    endDate: nullableText(dateKeySchema),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour.")
      .default(DEFAULT_MED_COLOR),
    remindersEnabled: z.boolean().default(true),
    reminderBeforeMinutes: z.coerce
      .number()
      .int()
      .min(0, "Must be at least 0 minutes.")
      .max(120, "Must be at most 120 minutes."),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date.",
      });
    }
  });

export type MedicationInput = z.infer<typeof medicationSchema>;
export type MedicationInputDraft = z.input<typeof medicationSchema>;