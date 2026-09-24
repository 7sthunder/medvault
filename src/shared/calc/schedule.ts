/**
 * Phase 12 — pure schedule → dose-event expansion (§10.2).
 *
 * `expandSchedule` is the single deterministic generator the whole app relies on:
 * given a medication (start/end/dosage) + its schedule slots and a local-day window,
 * it emits one dose per matching (day, enabled slot). No DB, no I/O — kept dependency-light
 * so it can be unit-tested exhaustively and shared by the server engine, dashboard reads,
 * and the scheduler's catch-up.
 */

import { addLocalDays, combineDateAndTime, localDateKey } from "../times";

/** A medication as seen by the generator (numeric `dosageAmount` cast strings accepted). */
export interface ScheduleMedication {
  id: string;
  dosageAmount: number | string;
  /** Local `YYYY-MM-DD`. */
  startDate: string;
  /** Local `YYYY-MM-DD` or `null` for open-ended. */
  endDate: string | null;
}

/** A schedule slot as seen by the generator (0=Sunday, matching `days_of_week`). */
export interface ScheduleSlot {
  id: string;
  /** Local `HH:mm`. */
  timeOfDay: string;
  daysOfWeek: readonly number[];
  enabled: boolean;
  /** Per-slot override; falls back to the medication dosage. */
  dosageAmount: number | string | null;
}

/** One generated dose event (pre-insert). */
export interface GeneratedDose {
  /** `scheduledFor` instant (tz-aware). */
  scheduledFor: Date;
  scheduleId: string;
  dosageAmount: number;
}

/** Date-key comparison works lexicographically for `YYYY-MM-DD`. */
function keyLessOrEqual(a: string, b: string): boolean {
  return a <= b;
}

/** Weekday (0=Sunday) of a local `YYYY-MM-DD` — calendar-date maths, tz-independent. */
function weekdayOfDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  // UTC noon sidesteps any local-date rollover edge on the probe instant.
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/** Upper bound on generated days so a malformed window can never loop forever. */
const MAX_EXPAND_DAYS = 732;

/**
 * Expand a schedule into concrete dose instants for every day `d ∈ [from, to]` where
 * `med.startDate ≤ d ≤ (med.endDate · or ∞)` and slot is enabled + on-weekday.
 * Deterministic: identical inputs → identical output. `from > to` and empty slots → `[]`.
 */
export function expandSchedule(
  med: ScheduleMedication,
  slots: readonly ScheduleSlot[],
  from: string,
  to: string,
  timeZone: string,
): GeneratedDose[] {
  if (!keyLessOrEqual(from, to)) return [];

  const doses: GeneratedDose[] = [];
  let day = combineDateAndTime(from, "00:00", timeZone);
  let guard = 0;

  while (keyLessOrEqual(localDateKey(day, timeZone), to) && guard < MAX_EXPAND_DAYS) {
    const dayKey = localDateKey(day, timeZone);

    // Bound by the medication's own window (startDate ≤ day ≤ endDate or open-ended).
    if (keyLessOrEqual(med.startDate, dayKey)) {
      if (med.endDate === null || keyLessOrEqual(dayKey, med.endDate)) {
        const weekday = weekdayOfDateKey(dayKey);
        for (const slot of slots) {
          if (!slot.enabled) continue;
          if (!slot.daysOfWeek.includes(weekday)) continue;
          doses.push({
            scheduledFor: combineDateAndTime(dayKey, slot.timeOfDay, timeZone),
            scheduleId: slot.id,
            dosageAmount: Number(slot.dosageAmount ?? med.dosageAmount),
          });
        }
      }
    }

    day = addLocalDays(day, 1, timeZone);
    guard += 1;
  }

  return doses;
}