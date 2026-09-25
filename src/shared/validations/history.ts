/**
 * Phase 16 — history query contract (§11.10). Range filters are day keys; `cursor`
 * is an ISO instant for cursor pagination (oldest action before it). All filters optional.
 */

import { z } from "zod";

import { dateKeySchema, uuidSchema } from "./common";

export const historyQuerySchema = z.object({
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  medicationId: uuidSchema.optional(),
  /** Filter by the event's resolved status (missed/skipped/taken/snoozed). */
  status: z.enum(["taken", "missed", "skipped", "snoozed"]).optional(),
  cursor: z.string().datetime().optional(),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
