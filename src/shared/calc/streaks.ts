/**
 * Phase 13 — pure streak semantics (§10.5).
 *
 * A calendar day is *in-regimen* when it has scheduled doses; an *adherent day* is an
 * in-regimen day with `missed === 0 && skipped === 0`. Non-regimen days never break a
 * run ("a day with no regimen doesn't break the streak"). `inProgress` marks today with
 * unresolved past doses: it counts toward the current streak as adherent-so-far but never
 * toward the longest (complete days only).
 */

import type { StreakSummaryDTO } from "../types";

export interface StreakDayInput {
  /** Calendar day `YYYY-MM-DD`. */
  date: string;
  scheduled: number;
  missed: number;
  skipped: number;
  /** Today with unresolved past doses — never counted by `longestStreak`. */
  inProgress?: boolean;
}

function isRegimen(day: StreakDayInput): boolean {
  return day.scheduled > 0;
}

function isAdherent(day: StreakDayInput): boolean {
  return day.scheduled > 0 && day.missed === 0 && day.skipped === 0;
}

/** Longest: max consecutive complete adherent days. Gaps and in-progress keep the run alive. */
function longestStreak(sorted: StreakDayInput[]): number {
  let longest = 0;
  let run = 0;
  for (const day of sorted) {
    if (!isRegimen(day)) continue;
    if (isAdherent(day)) {
      if (!day.inProgress) {
        run += 1;
        if (run > longest) longest = run;
      }
    } else {
      run = 0;
    }
  }
  return longest;
}

export function computeStreaks(
  days: readonly StreakDayInput[],
  todayKey: string,
): StreakSummaryDTO {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Anchor: the most recent in-regimen day at or before today.
  let anchor = -1;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i]!.date <= todayKey && isRegimen(sorted[i]!)) {
      anchor = i;
      break;
    }
  }

  let current = 0;
  let currentEndsToday = false;
  if (anchor >= 0) {
    // Walk backwards from the anchor; a non-adherent in-regimen day breaks the run,
    // non-regimen gaps between adherent days do not.
    for (let i = anchor; i >= 0; i -= 1) {
      const day = sorted[i]!;
      if (!isRegimen(day)) continue;
      if (!isAdherent(day)) break;
      current += 1;
    }
    const anchorDay = sorted[anchor]!;
    currentEndsToday =
      anchorDay.date === todayKey && isAdherent(anchorDay) && anchorDay.inProgress === true;
  }

  return { current, longest: longestStreak(sorted), currentEndsToday };
}
