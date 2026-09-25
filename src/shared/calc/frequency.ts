/**
 * Phase 11 — Frequency label derivation & helpers (plan §8.4, §10.1).
 *
 * Derives the canonical `FrequencyLabel` ("once-daily" | "twice-daily" |
 * "n-times-daily" | "custom-weekdays") from a medication's enabled schedule slots.
 */

import { FREQUENCY_LABEL_TEXT, type FrequencyLabel } from "../enums";

export interface SlotFrequencyLike {
  daysOfWeek?: number[] | null;
  enabled?: boolean | null;
}

const ALL_DAYS_SET = new Set([0, 1, 2, 3, 4, 5, 6]);

/**
 * Checks if a given daysOfWeek array represents all 7 calendar days.
 */
function isEveryDay(days?: number[] | null): boolean {
  if (!days || days.length !== 7) return false;
  return days.every((d) => ALL_DAYS_SET.has(d)) && new Set(days).size === 7;
}

/**
 * Derives the canonical FrequencyLabel from a collection of schedule slots.
 * Only enabled slots are factored into the calculation.
 */
export function deriveFrequency(slots?: readonly SlotFrequencyLike[] | null): FrequencyLabel {
  if (!slots || slots.length === 0) {
    return "once-daily";
  }

  const enabledSlots = slots.filter((s) => s.enabled !== false);
  if (enabledSlots.length === 0) {
    return "once-daily";
  }

  // Check if every enabled slot runs every day (all 7 days)
  const allDaily = enabledSlots.every((s) => isEveryDay(s.daysOfWeek));
  if (!allDaily) {
    return "custom-weekdays";
  }

  const count = enabledSlots.length;
  if (count === 1) return "once-daily";
  if (count === 2) return "twice-daily";
  return "n-times-daily";
}

/**
 * Formats a FrequencyLabel into a human-friendly string.
 * If label is "n-times-daily" and an explicit slotCount is provided,
 * formats as e.g. "3 times daily" or "4 times daily".
 */
export function formatFrequencyLabel(label: FrequencyLabel, slotCount?: number): string {
  if (label === "n-times-daily" && typeof slotCount === "number" && slotCount > 2) {
    return `${slotCount} times daily`;
  }
  return FREQUENCY_LABEL_TEXT[label] ?? label;
}
