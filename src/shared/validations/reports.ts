/**
 * Phase 07 — reports contract (plan §13 `reportsSchema`, §10.9). The server validates
 * with `reportsSchemaFor(todayKey)` so "to ≤ today+1" is enforced against the *server's*
 * clock (never the client's).
 */

import { z } from "zod";

import { REPORT_MAX_SPAN_DAYS } from "../constants";
import { REPORT_GRANULARITIES } from "../enums";
import { dateKeySchema } from "./common";

export const reportsBaseSchema = z.object({
  granularity: z.enum(REPORT_GRANULARITIES).default("daily"),
  from: dateKeySchema,
  to: dateKeySchema,
  medicationId: z.uuid("Invalid medication id.").nullish(),
});

/**
 * Full range rules depend on "today" (server-side). `from ≤ to` and span ≤ 366 days
 * are always enforced; the `to ≤ today+1` ceiling only applies when a `todayKey`
 * is supplied — the server passes its own clock so a client-sent future date is rejected.
 */
export function reportsSchemaFor(todayKey?: string) {
  const maxToKey = todayKey ? addDayKey(todayKey) : undefined;

  return reportsBaseSchema.superRefine((data, ctx) => {
    if (data.from > data.to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["from"], message: "Start date must be before the end date." });
      return;
    }
    const span = Math.round(
      (new Date(`${data.to}T00:00:00Z`).getTime() - new Date(`${data.from}T00:00:00Z`).getTime()) / 86_400_000,
    );
    if (span > REPORT_MAX_SPAN_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: `Range must span at most ${REPORT_MAX_SPAN_DAYS} days.`,
      });
    }
    if (maxToKey && data.to > maxToKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "End date cannot be in the future.",
      });
    }
  });
}

/** Shift a `YYYY-MM-DD` key by one day (UTC arithmetic — keys have no timezone). */
function addDayKey(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Loose client-side variant (no "today" clock needed). */
export const reportsSchema = reportsSchemaFor();

export type ReportsInput = z.infer<typeof reportsBaseSchema>;