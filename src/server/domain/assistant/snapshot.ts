/**
 * Read-only views of the patient's own data, for the assistant to answer questions from.
 *
 * Everything here is a SELECT scoped by `userId`, and the shape is deliberately *summarised*
 * rather than raw: a compact "3 active, next dose 21:00" is enough for the model to answer
 * without shipping the whole history to Google, and it keeps the prompt small.
 *
 * There is no write in this file, and no way for the model to name a user — it only ever gets
 * one snapshot, the caller's own.
 */

import { and, eq, gte, inArray, sql } from "drizzle-orm";

import { db as defaultDb } from "@/server/db/client";
import type { Db } from "@/server/db/helpers";
import { adherenceDaily, doseEvents, medications, medicationSchedules } from "@/server/db/schema";

const ACTIVE_MEDICATION_LIMIT = 25;
const UPCOMING_DOSE_LIMIT = 5;
const ADHERENCE_WINDOW_DAYS = 7;

export interface PatientSnapshot {
  /** Compact, model-facing facts. Never contains ids. */
  text: string;
  /** Coarse counters, used server-side to keep the snapshot honest and cheap. */
  activeMedicationCount: number;
}

/** Today's `YYYY-MM-DD` in the patient's timezone, so day boundaries match what they see. */
function localDateKey(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/**
 * Everything the model is allowed to know about this patient for the current turn.
 * Returns an empty-string `text` for a brand-new account so the prompt degrades cleanly.
 */
export async function buildSnapshot(
  userId: string,
  timeZone: string,
  at: Date,
  db: Db = defaultDb,
): Promise<PatientSnapshot> {
  const todayKey = localDateKey(at, timeZone);

  const [medRows, upcoming, adherenceRows] = await Promise.all([
    db
      .select({
        name: medications.name,
        dosageAmount: medications.dosageAmount,
        dosageUnit: medications.dosageUnit,
        instructions: medications.instructions,
        times: sql<
          string[]
        >`coalesce(array_agg(${medicationSchedules.timeOfDay} order by ${medicationSchedules.timeOfDay}), '{}')`,
      })
      .from(medications)
      .leftJoin(
        medicationSchedules,
        and(
          eq(medicationSchedules.medicationId, medications.id),
          eq(medicationSchedules.enabled, true),
        ),
      )
      .where(and(eq(medications.userId, userId), eq(medications.status, "active")))
      .groupBy(medications.id)
      .limit(ACTIVE_MEDICATION_LIMIT),
    db
      .select({
        name: medications.name,
        scheduledFor: doseEvents.scheduledFor,
        status: doseEvents.status,
      })
      .from(doseEvents)
      .innerJoin(medications, eq(medications.id, doseEvents.medicationId))
      .where(
        and(
          eq(doseEvents.userId, userId),
          gte(doseEvents.scheduledFor, at),
          inArray(doseEvents.status, ["upcoming", "due"]),
        ),
      )
      .orderBy(doseEvents.scheduledFor)
      .limit(UPCOMING_DOSE_LIMIT),
    db
      .select({
        scheduled: sql<number>`coalesce(sum(${adherenceDaily.scheduled}), 0)`,
        taken: sql<number>`coalesce(sum(${adherenceDaily.taken}), 0)`,
        missed: sql<number>`coalesce(sum(${adherenceDaily.missed}), 0)`,
        skipped: sql<number>`coalesce(sum(${adherenceDaily.skipped}), 0)`,
      })
      .from(adherenceDaily)
      .where(
        and(
          eq(adherenceDaily.userId, userId),
          gte(adherenceDaily.date, shiftDateKey(todayKey, -(ADHERENCE_WINDOW_DAYS - 1))),
        ),
      ),
  ]);

  const adherence = adherenceRows[0];
  const lines: string[] = [];

  lines.push(
    medRows.length === 0
      ? "Active medications: none yet."
      : `Active medications (${medRows.length}):\n` +
          medRows
            .map((m) => {
              const dose = `${m.dosageAmount}${m.dosageUnit ? ` ${m.dosageUnit}` : ""}`;
              const when = m.times.length > 0 ? m.times.join(", ") : "no time set";
              const how = m.instructions ? ` (${m.instructions})` : "";
              return `- ${m.name} ${dose}, ${when}${how}`;
            })
            .join("\n"),
  );

  if (upcoming.length > 0) {
    lines.push(
      "Next scheduled doses:\n" +
        upcoming
          .map(
            (d) =>
              `- ${d.name} at ${new Intl.DateTimeFormat("en-GB", {
                timeZone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }).format(d.scheduledFor)} (${d.status})`,
          )
          .join("\n"),
    );
  } else {
    lines.push("Next scheduled doses: nothing scheduled from now on.");
  }

  if (adherence && Number(adherence.scheduled) > 0) {
    const pct = Math.round((Number(adherence.taken) / Number(adherence.scheduled)) * 100);
    lines.push(
      `Last ${ADHERENCE_WINDOW_DAYS} days: ${adherence.taken} of ${adherence.scheduled} doses taken (${pct}%), ${adherence.missed} missed, ${adherence.skipped} skipped.`,
    );
  } else {
    lines.push(`Last ${ADHERENCE_WINDOW_DAYS} days: no doses recorded yet.`);
  }

  lines.push(`Today is ${todayKey}.`);

  return { text: lines.join("\n\n"), activeMedicationCount: medRows.length };
}
/** `YYYY-MM-DD` shifted by whole days, without pulling in a date library. */
function shiftDateKey(dateKey: string, days: number): string {
  const parsed = Date.parse(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) return dateKey;
  return new Date(parsed + days * 86_400_000).toISOString().slice(0, 10);
}
