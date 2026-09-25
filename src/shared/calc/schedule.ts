/**
 * Phase 12 — Pure schedule expansion engine (plan §10.2).
 *
 * Expands medication schedule slots across a date horizon into concrete
 * planned dose instances. Pure and timezone-aware: computes local calendar
 * days and weekdays in the user's timezone, combining them into exact UTC instants.
 */

import { addLocalDays, combineDateAndTime, localDateKey, startOfLocalDay } from "../times";

export interface ExpandScheduleMedication {
  id: string;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string | null; // "YYYY-MM-DD" or null
  status: "active" | "paused";
}

export interface ExpandScheduleSlot {
  id: string;
  timeOfDay: string; // "HH:mm"
  daysOfWeek: number[]; // 0=Sunday ... 6=Saturday
  dosageAmount?: number | string | null;
  instructionOverride?: string | null;
  enabled?: boolean;
}

export interface PlannedDoseEvent {
  medicationId: string;
  scheduleId: string;
  scheduledFor: Date;
  dateKey: string;
  timeOfDay: string;
}

export interface ExpandScheduleOptions {
  from: Date | string; // Instant or dateKey
  to: Date | string; // Instant or dateKey
  timeZone: string;
}

/**
 * Pure generator that expands a medication and its enabled slots across [from, to].
 *
 * Rules:
 * - If medication is not "active", emits 0 events.
 * - Filters for enabled slots only (`enabled !== false`).
 * - For each calendar day d in [from, to] (inclusive):
 *   - Checks if med.startDate <= d <= (med.endDate ?? infinity).
 *   - Matches day-of-week against slot.daysOfWeek.
 *   - Combines local date + slot.timeOfDay in timeZone -> UTC Date.
 * - Sorts output deterministically by scheduledFor ascending.
 */
export function expandSchedule(
  medication: ExpandScheduleMedication,
  slots: readonly ExpandScheduleSlot[],
  options: ExpandScheduleOptions,
): PlannedDoseEvent[] {
  if (medication.status !== "active") {
    return [];
  }

  const enabledSlots = slots.filter((s) => s.enabled !== false);
  if (enabledSlots.length === 0) {
    return [];
  }

  const { timeZone } = options;

  // Normalise from/to to local calendar day keys (YYYY-MM-DD)
  const fromKey = typeof options.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(options.from)
    ? options.from
    : localDateKey(options.from, timeZone);

  const toKey = typeof options.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(options.to)
    ? options.to
    : localDateKey(options.to, timeZone);

  if (fromKey > toKey) {
    return [];
  }

  const planned: PlannedDoseEvent[] = [];

  // Iterate day by day from fromKey to toKey
  let currentInstant = startOfLocalDay(combineDateAndTime(fromKey, "00:00", timeZone), timeZone);
  let currentKey = localDateKey(currentInstant, timeZone);

  // Safeguard against infinite loops (max 366 days)
  let loopCount = 0;
  const MAX_DAYS = 366;

  while (currentKey <= toKey && loopCount < MAX_DAYS) {
    loopCount++;

    // Check medication date window: startDate <= currentKey <= (endDate ?? inf)
    const isAfterStart = currentKey >= medication.startDate;
    const isBeforeEnd = !medication.endDate || currentKey <= medication.endDate;

    if (isAfterStart && isBeforeEnd) {
      // Get the local day of week in timeZone (0=Sun, 6=Sat)
      const dayOfWeek = currentInstant.getDay();

      for (const slot of enabledSlots) {
        if (slot.daysOfWeek.includes(dayOfWeek)) {
          const scheduledFor = combineDateAndTime(currentKey, slot.timeOfDay, timeZone);
          planned.push({
            medicationId: medication.id,
            scheduleId: slot.id,
            scheduledFor,
            dateKey: currentKey,
            timeOfDay: slot.timeOfDay,
          });
        }
      }
    }

    currentInstant = addLocalDays(currentInstant, 1, timeZone);
    currentKey = localDateKey(currentInstant, timeZone);
  }

  return planned.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
}
