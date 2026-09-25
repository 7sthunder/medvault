/**
 * Phase 16 — Pure adherence streaks engine (plan §10.5).
 *
 * Rules:
 * - A calendar day is in-regimen if `scheduled > 0`.
 * - A day is adherent if `in-regimen && missed === 0 && skipped === 0`.
 * - Rest days (`scheduled === 0`) do not break the streak.
 * - Current streak: consecutive run of adherent days ending today or on the most recent in-regimen day.
 * - In-progress today counts toward current streak if adherent-so-far.
 * - Longest streak: max consecutive adherent days in completed days.
 */

import type { StreakSummaryDTO } from "../types";

export interface DayStreakInput {
  date: string;
  scheduled: number;
  taken: number;
  missed: number;
  skipped: number;
}

export interface CalculateStreaksOptions {
  todayKey?: string;
  isTodayAdherentSoFar?: boolean;
}

export function calculateStreaks(
  days: DayStreakInput[],
  options?: CalculateStreaksOptions,
): StreakSummaryDTO {
  if (days.length === 0) {
    return { current: 0, longest: 0, currentEndsToday: false };
  }

  // Sort chronologically ascending
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // 1. Calculate longest streak across completed days
  let longest = 0;
  let running = 0;

  for (const day of sorted) {
    // If today is in progress, it does not count towards historical longest streak unless complete
    if (options?.todayKey && day.date === options.todayKey) {
      continue;
    }

    if (day.scheduled > 0) {
      if (day.missed === 0 && day.skipped === 0) {
        running += 1;
        if (running > longest) longest = running;
      } else {
        running = 0;
      }
    }
    // Rest days (scheduled === 0) preserve the running streak without incrementing or resetting
  }

  // 2. Calculate current streak walking backward from the latest day
  let current = 0;
  let currentEndsToday = false;

  const reversed = [...sorted].reverse();
  let index = 0;

  // Handle today if present in the data
  if (options?.todayKey && reversed[0]?.date === options.todayKey) {
    const today = reversed[0];
    index = 1; // start rest of loop from yesterday

    if (today.scheduled > 0) {
      if (options.isTodayAdherentSoFar ?? (today.missed === 0 && today.skipped === 0)) {
        current += 1;
        currentEndsToday = true;
      } else {
        // Today has a missed or skipped dose: current streak is broken
        return {
          current: 0,
          longest: Math.max(longest, running),
          currentEndsToday: false,
        };
      }
    } else {
      // Today has 0 doses scheduled (rest day)
      currentEndsToday = false;
    }
  }

  // Walk backward through past days
  for (let i = index; i < reversed.length; i++) {
    const day = reversed[i]!;
    if (day.scheduled > 0) {
      if (day.missed === 0 && day.skipped === 0) {
        current += 1;
      } else {
        break; // Streak broken
      }
    }
    // Rest days (scheduled === 0) preserve the streak
  }

  return {
    current,
    longest: Math.max(longest, current),
    currentEndsToday,
  };
}
