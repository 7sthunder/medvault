/**
 * Phase 13 — adherence materialization (§10.5 `recomputeDay`/`recomputeRange`/prune).
 *
 * Turns `dose_events` into `adherence_daily` rows (user-wide rollup, `medicationId IS NULL`)
 * for every local calendar day inside a window. Delete-then-insert keeps it idempotent and
 * simple; the service recomputes from events — never from the seed's precomputed rows — so
 * the §19 sample totals are provably reproduced by the engine. `pruneAdherence` bounds the
 * history window per user.
 */

import { and, eq, gte, isNull, lt, lte } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { adherenceDaily, doseEvents } from "@/server/db/schema";
import { ADHERENCE_PRUNE_DAYS } from "@/shared/constants";
import { isPendingStatus } from "@/shared/calc/doseState";
import { adherencePercent } from "@/shared/calc/adherence";
import { addLocalDays, combineDateAndTime, localDateKey, now as sharedNow } from "@/shared/times";

export interface RecalculatedDay {
  date: string;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
  snoozed: number;
  adherencePercent: number | null;
  streakDay: boolean;
  /** True when the day still holds unresolved past doses (adherent-so-far only). */
  inProgress: boolean;
}

export interface RecomputeRangeOptions {
  userId: string;
  fromKey: string;
  toKey: string;
  timeZone: string;
  /** When present, scope to one medication — reserved for future per-med rollups. */
  medicationId?: string | null;
  now?: Date;
}

const RESOLVED = new Set(["taken", "missed", "skipped"]);

/** Recompute + persist `adherence_daily` for a contiguous day window. Returns the rows. */
export async function recomputeRange(db: DbClient, opts: RecomputeRangeOptions): Promise<RecalculatedDay[]> {
  const timeZone = opts.timeZone;
  const start = combineDateAndTime(opts.fromKey, "00:00", timeZone);
  const end = addLocalDays(combineDateAndTime(opts.toKey, "00:00", timeZone), 1, timeZone);
  const atMs = (opts.now ?? sharedNow()).getTime();

  const rows = await db
    .select({
      scheduledFor: doseEvents.scheduledFor,
      status: doseEvents.status,
      snoozeCount: doseEvents.snoozeCount,
      medicationId: doseEvents.medicationId,
    })
    .from(doseEvents)
    .where(
      and(
        eq(doseEvents.userId, opts.userId),
        opts.medicationId == null ? undefined : eq(doseEvents.medicationId, opts.medicationId),
        gte(doseEvents.scheduledFor, start),
        lt(doseEvents.scheduledFor, end),
      ),
    );

  interface DayAcc {
    scheduled: number;
    taken: number;
    missed: number;
    skipped: number;
    snoozed: number;
    pendingPast: boolean;
  }
  const byDay = new Map<string, DayAcc>();

  for (const row of rows) {
    const key = localDateKey(row.scheduledFor, timeZone);
    const acc = (byDay.get(key) ?? {
      scheduled: 0,
      taken: 0,
      missed: 0,
      skipped: 0,
      snoozed: 0,
      pendingPast: false,
    });
    byDay.set(key, acc);

    if (RESOLVED.has(row.status)) {
      acc.scheduled += 1;
      if (row.status === "taken") acc.taken += 1;
      else if (row.status === "missed") acc.missed += 1;
      else acc.skipped += 1;
    }
    if (row.snoozeCount !== null && row.snoozeCount > 0) acc.snoozed += 1;
    if (isPendingStatus(row.status) && row.scheduledFor.getTime() < atMs) acc.pendingPast = true;
  }

  const days: RecalculatedDay[] = [];
  for (const [date, acc] of byDay) {
    const counts = {
      scheduled: acc.scheduled,
      taken: acc.taken,
      missed: acc.missed,
      skipped: acc.skipped,
    };
    const percent = adherencePercent(counts);
    days.push({
      date,
      ...counts,
      snoozed: acc.snoozed,
      adherencePercent: percent,
      streakDay: false,
      inProgress: acc.pendingPast,
    });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));

  // Day-level streak flag mirrors `computeStreaks`'s *current* run: only days belonging
  // to the trailing adherent run (most recent in-regimen day ≤ today walked backwards)
  // are flagged. A clean-but-recovery day earlier in the window is not a streak day, so
  // the flag reports the §19 "7-day current streak" (impl.md deviation), not a naive
  // "any clean day" marker.
  const todayKey = localDateKey(opts.now ?? sharedNow(), timeZone);
  let anchor = days.length - 1;
  while (anchor >= 0 && !(days[anchor]!.scheduled > 0 && days[anchor]!.date <= todayKey)) anchor -= 1;
  if (anchor >= 0) {
    const flagged = new Set<number>();
    for (let i = anchor; i >= 0; i -= 1) {
      const d = days[i]!;
      if (d.scheduled === 0) continue; // non-regimen gap never breaks nor extends the run
      if (d.missed > 0 || d.skipped > 0) break;
      flagged.add(i);
    }
    if (flagged.size > 0) {
      for (const i of flagged) days[i]!.streakDay = true;
    }
  }

  // Idempotent write: replace this exact scope (user-wide or per-med) for the window.
  await db
    .delete(adherenceDaily)
    .where(
      and(
        eq(adherenceDaily.userId, opts.userId),
        ...(opts.medicationId == null
          ? [isNull(adherenceDaily.medicationId)]
          : [eq(adherenceDaily.medicationId, opts.medicationId!)]),
        gte(adherenceDaily.date, opts.fromKey),
        lte(adherenceDaily.date, opts.toKey),
      ),
    );

  if (days.length > 0) {
    await db.insert(adherenceDaily).values(
      days.map((d) => ({
        id: uuidv7(),
        userId: opts.userId,
        date: d.date,
        medicationId: opts.medicationId ?? null,
        scheduled: d.scheduled,
        taken: d.taken,
        missed: d.missed,
        skipped: d.skipped,
        snoozed: d.snoozed,
        adherencePercent: d.adherencePercent === null ? null : d.adherencePercent.toFixed(2),
        streakDay: d.streakDay,
      })),
    );
  }

  return days;
}

/** Single-day convenience wrapper (every user action recomputes its day(s)). */
export function recomputeDay(
  db: DbClient,
  opts: { userId: string; dateKey: string; timeZone: string; medicationId?: string | null; now?: Date },
): Promise<RecalculatedDay[]> {
  return recomputeRange(db, { ...opts, fromKey: opts.dateKey, toKey: opts.dateKey });
}

/** Trim `adherence_daily` rows older than the history window. Returns rows removed. */
export async function pruneAdherence(db: DbClient, userId: string, options: { now?: Date } = {}): Promise<number> {
  const cutoffKey = localDateKey(addLocalDays(options.now ?? sharedNow(), -ADHERENCE_PRUNE_DAYS, "UTC"), "UTC");
  const removed = await db
    .delete(adherenceDaily)
    .where(and(eq(adherenceDaily.userId, userId), lt(adherenceDaily.date, cutoffKey)))
    .returning({ id: adherenceDaily.id });
  return removed.length;
}