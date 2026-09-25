/**
 * Phase 19 — History query validation schema (plan §11.10, §13).
 */

import { z } from "zod";
import { DOSE_ACTION_TYPES } from "../enums";

export const historyQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  medicationId: z.string().optional(),
  action: z.enum(["all", ...DOSE_ACTION_TYPES]).optional().default("all"),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type HistoryQueryInput = z.input<typeof historyQuerySchema>;
export type HistoryQueryOutput = z.output<typeof historyQuerySchema>;
