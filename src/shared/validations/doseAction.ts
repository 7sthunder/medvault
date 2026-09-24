/**
 * Phase 07 — dose action contract (plan §13 `doseActionSchema`, §10.3/§10.4).
 * `take`/`snooze`/`skip` come from the UI; the system-authored audit actions
 * (`missed_auto`, `voided`, …) never pass through this schema.
 */

import { z } from "zod";

import { SKIP_REASON_MAX } from "../constants";
import { uuidSchema } from "./common";

const base = { doseId: uuidSchema };

export const doseActionSchema = z.discriminatedUnion("action", [
  z.object({ ...base, action: z.literal("take") }),
  z.object({ ...base, action: z.literal("snooze") }),
  z.object({
    ...base,
    action: z.literal("skip"),
    skipReason: z
      .string()
      .trim()
      .max(SKIP_REASON_MAX, `Reason must be at most ${SKIP_REASON_MAX} characters.`)
      .optional(),
  }),
]);

export type DoseActionInput = z.infer<typeof doseActionSchema>;

export const takeDoseInputSchema = z.object({ doseId: uuidSchema });